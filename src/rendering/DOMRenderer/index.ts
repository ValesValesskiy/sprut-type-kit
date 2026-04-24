import { RenderInput } from './RenderInput';
import { RenderRow } from './RenderRow';
import { RenderTextField } from './RenderTextField';
import { VRenderInput } from './VRenderInput';
import { toLeft, toRight } from './behavior';
import { getVInputByInputSymbolIndex } from './utils';

import { Input, Row, Cursor, sortCursors } from '../../dataModel';

export function createField({ text }: { text: string }) {
  const field = new RenderTextField<HTMLElement>();

  const fieldElement = document.createElement('div');
  const rows = document.createElement('div');
  const cursors = document.createElement('div');

  const hiddenInput = document.createElement('div');

  fieldElement.tabIndex = 0;
  fieldElement.classList.add('field');
  fieldElement.style.whiteSpace = 'pre';

  rows.classList.add('rows');
  fieldElement.append(rows);
  field.rowsElement = rows;

  cursors.classList.add('cursors');
  fieldElement.append(cursors);
  field.cursorsElement = cursors;

  hiddenInput.contentEditable = 'true';
  hiddenInput.tabIndex = 0;
  hiddenInput.style.position = 'absolute';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.pointerEvents = 'none';

  fieldElement.append(hiddenInput);
  fieldElement.addEventListener('focus', () => {
    hiddenInput.focus();
  });

  field.element = fieldElement;

  field.on('row:add', function (renderRow) {
    const el = (renderRow.element = document.createElement('div'));

    el.classList.add('row');

    const nextRenderNode = renderRow.siblings.next;

    if (nextRenderNode) {
      renderRow.siblings.insertBefore(nextRenderNode);
      rows.insertBefore(renderRow.element, nextRenderNode.element!);
    } else {
      rows.append(renderRow.element);
    }

    this.rowViewToRenderMap.set(renderRow.element, renderRow);
  });

  field.on('row:remove', function (renderRow) {
    renderRow.element?.remove();
    field.dataRowToRenderMap.delete(renderRow.dataNode!);
    console.log('[Remove Row]:', renderRow);
  });

  field.on('v-input:add', (...vInputs) => {
    for (let vInput of vInputs) {
      const vInputElement = document.createElement('span');

      vInputElement.classList.add('v-input');
      vInput.element = vInputElement;

      field.vInputViewToRenderMap.set(vInputElement, vInput);
    }

    for (let vInput of vInputs) {
      const vInputElement = vInput.element!;
      const renderInput = vInput.siblings.parent!;

      if (vInput?.renderViewNode) {
        vInputElement.append(vInput?.renderViewNode());
      } else {
        vInputElement.textContent = vInput.content || '\u200B';
      }

      if (vInputs[vInputs.length - 1].siblings.next) {
        renderInput.element!.insertBefore(
          vInputElement,
          vInputs[vInputs.length - 1].siblings.next!.element!
        );
      } else {
        renderInput.element!.append(vInputElement);
      }
    }
  });

  field.on('v-input:remove', function (vInput) {
    vInput.element?.remove();
    field.vInputViewToRenderMap.delete(vInput.element!);
    console.log('[Remove V-Input]:', vInput);
  });

  field.on('input:add', function (renderInput) {
    const el = (renderInput.element = document.createElement('span'));

    el.classList.add('input');

    const nextRenderNode = renderInput.siblings.next;

    if (nextRenderNode && nextRenderNode?.element?.parentElement) {
      nextRenderNode.element.parentElement.insertBefore(
        nextRenderNode.element!,
        renderInput.element
      );
    } else {
      console.log(renderInput.siblings);
      renderInput.siblings.parent!.element!.append(renderInput.element);
    }

    this.inputViewToRenderMap.set(renderInput.element, renderInput);

    const vInput = new VRenderInput<HTMLElement>({
      offset: 0,
    });

    renderInput.siblings.appendChild(vInput);
  });

  field.on('input:remove', function (renderInput) {
    renderInput.element?.remove();
    field.dataInputToRenderMap.delete(renderInput.dataNode!);
    console.log('[Remove Input]:', renderInput);
  });

  field.on('cursor:add', function (cursor) {
    const el = (cursor.element = document.createElement('div'));

    el.classList.add('cursor');
    el.style.userSelect = 'none';
    el.style.pointerEvents = 'none';

    this.cursorsElement!.append(el);
  });

  field.on('cursor:translate', function (renderCursor, { renderInput }) {
    let { vInput, index } = renderCursor.getVInputByCursorPosition();
    console.log(renderCursor.dataNode, vInput, index);
    if (!vInput) {
      throw new Error('');
    }

    /* Если мы в начале инпута и есть предыдущий сосед */
    const isStartWithPrevioius = index === 0 && vInput.siblings.previous;

    if (vInput.renderViewNode && !isStartWithPrevioius) {
      renderCursor.element!.style.display = 'none';
    } else {
      if (vInput.renderViewNode && isStartWithPrevioius) {
        vInput = vInput.siblings.previous!;
        index = vInput.length;
      }

      const range = document.createRange();

      range.setStart(vInput.element!.firstChild!, index);
      range.setEnd(vInput.element!.firstChild!, index);
      const rect = range.getBoundingClientRect();

      renderCursor.element!.style.display = 'block';
      renderCursor.element!.style.position = 'absolute';
      renderCursor.element!.style.left = rect.left + 'px';
      renderCursor.element!.style.top = rect.top + 'px';
      renderCursor.element!.style.width = rect.width + 'px';
      renderCursor.element!.style.height = rect.height + 'px';
    }
  });

  field.on('cursor:remove', function (renderCursor) {
    renderCursor.element?.remove();
  });

  fieldElement.addEventListener('mousedown', function (e) {
    const caretPosition = document.caretPositionFromPoint(e.clientX, e.clientY);

    let vRenderInput: VRenderInput<HTMLElement> | undefined = undefined;
    let currentNode = caretPosition?.offsetNode.parentElement!;

    while (!vRenderInput) {
      vRenderInput = field.vInputViewToRenderMap.get(currentNode);

      currentNode = currentNode.parentElement!;
    }

    if (vRenderInput.renderViewNode) {
      return;
    }

    const renderInput = vRenderInput?.siblings.parent;
    let newCursor: Cursor;
    console.log(renderInput);
    if (!field.dataNode.cursors.length || e.ctrlKey) {
      if (field.dataNode.cursors.length) {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode!.meta.isOwn
        );

        // Кажется это сравнение на установку курсора в одну позицию с другим
        if (
          ownCursors.some(
            ({ dataNode }) =>
              dataNode?.input === renderInput?.dataNode &&
              caretPosition!.offset! === dataNode!.positionInInput!
          )
        ) {
          return;
        }
      }

      newCursor = new Cursor({
        field: field!.dataNode!,
        input: renderInput!.dataNode!,
        positionInInput: caretPosition?.offset! + vRenderInput?.startIndex!,
      });

      newCursor.meta.isOwn = true;
      field.dataNode.addCursor(newCursor);
    } else {
      const ownCursors = field.dataNode.cursors.filter(
        (cursor) => cursor.meta.isOwn
      );

      for (let c = 1; c < ownCursors.length; c++) {
        const cursor = ownCursors[c];

        cursor.destruct();
      }
      newCursor = ownCursors[0];
    }

    // TODO: Работа с индексами внутренних инпутов для вычисления оффсета, потому в caretPosition позиция курсора внутри vInput
    newCursor.translate(
      renderInput!.dataNode!,
      renderInput!.dataNode!.content.length === 0
        ? 0
        : caretPosition?.offset! + vRenderInput?.startIndex!
    );
  });

  field.on('input:change', (renderInput) => {
    if (renderInput.siblings.children.length === 1) {
      renderInput.siblings.children[0].element!.textContent =
        renderInput.dataNode!.content || '\u200B';

      renderInput.siblings.children[0].offset =
        renderInput.dataNode!.content.length || 1;
    } else {
      renderInput.siblings.children[1].offset += 1;
      renderInput.siblings.children.forEach((ch) => {
        if (ch.content !== ch.element!.textContent) {
          ch.element!.textContent = ch.content!;

          if (ch.siblings.next) {
            ch.siblings.next.offset = ch.content!.length;
          }
        }
      });
    }
  });

  //   field.on('input:change', (renderInput) => {
  //     requestAnimationFrame(() => {
  //       const str = renderInput.dataNode!.content;
  //       const match = str.match('@@@@@');

  //       if (match) {
  //         const f = getVInputByInputSymbolIndex(renderInput, match.index!);
  //         console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', f);
  //         if (f.vInput && f.vInput.content === '@@@@@') {
  //           alert();
  //           console.log('dfg');
  //           return;
  //         }

  //         const first = new VRenderInput<HTMLElement>({
  //           offset: match.index!,
  //         });
  //         const second = new VRenderInput<HTMLElement>({
  //           offset: match[0].length,
  //         });
  //         const third = new VRenderInput<HTMLElement>({
  //           offset: str.length - match[0].length - match.index!,
  //         });

  //         renderInput.siblings.children[0].siblings.remove();
  //         renderInput.siblings.appendChilds(
  //           ...[first, second, third].filter((n) => n.offset)
  //         );
  //       }
  //     });
  //   });

  field.on('input:mutation:insert', (renderInput, { data, position }) => {
    const mutatedVInput = getVInputByInputSymbolIndex(renderInput, position);

    if (!mutatedVInput.vInput) {
      throw new Error('');
    }

    if (mutatedVInput.vInput.siblings.next) {
      mutatedVInput.vInput.siblings.next.offset += data.length;
    }

    mutatedVInput.vInput!.element!.textContent =
      mutatedVInput.vInput!.content ?? '[ERROR]';

    const str = renderInput.dataNode!.content;
    const matches = str.matchAll(/@@@@@/g);
    const r = /@@@@@/g;
    let match;

    while ((match = r.exec(str))) {
      console.log('[MATCH ALL]', [...matches], match, str);
      if (match) {
        const matchedVInput = getVInputByInputSymbolIndex(
          renderInput,
          match.index!,
          false
        );
        const matchedVInputEnd = getVInputByInputSymbolIndex(
          renderInput,
          match.index! + match[0].length - 1,
          false
        );
        console.log(
          '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
          matchedVInput,
          match,
          matchedVInput.vInput?.content
        );
        if (
          matchedVInput.vInput?.renderViewNode ||
          matchedVInputEnd.vInput?.renderViewNode
        ) {
          //alert();
          console.log('dfg');
          continue;
        }

        const first = new VRenderInput<HTMLElement>({
          offset: matchedVInput.vInput!.offset,
        });
        const second = new VRenderInput<HTMLElement>({
          offset: match.index! - matchedVInput.vInput!.startIndex,
          renderViewNode() {
            const el = document.createElement('span');

            el.style.display = 'inline-block';
            el.style.margin = '0 4px';
            el.style.borderRadius = '4px';
            el.style.backgroundColor = '#63a1ff';
            el.style.color = '#ffffff';

            el.classList.add('v-input-demo');

            el.innerText = 'Virtual Input';
            return el;
          },
        });
        second.focus = () => {
          second.element!.classList.add('active');
        };
        second.blur = () => {
          second.element!.classList.remove('active');
        };
        const third = new VRenderInput<HTMLElement>({
          offset: match[0].length,
        });

        if (matchedVInput.vInput?.siblings.next) {
          matchedVInput.vInput.siblings.next.offset =
            matchedVInput.vInput?.length -
            (match.index! - matchedVInput.vInput!.startIndex) -
            match[0].length;
        }

        console.log('[V Inputs]', first, second, third);
        console.log(
          '[V-INPUTTS OFFSETS]',
          [first, second, third].map((n) => n.offset)
        );
        //   renderInput.siblings.children[0].siblings.remove();
        //   renderInput.siblings.appendChilds(
        //     ...[first, second, third].filter((n) => true || n.offset)
        //   );
        const n = matchedVInput.vInput!.siblings.next;
        const p = matchedVInput.vInput!.siblings.parent;
        matchedVInput.vInput!.siblings.remove();
        matchedVInput.vInput!.throughOffset = true;
        let push = [first, second, third];
        if (false && second.offset === 0) {
          push = [second, third];
          second.offset = first.offset;
        }
        if (n) {
          n?.siblings.insertBeforeThis(...push);
        } else {
          p?.siblings.appendChilds(...push);
        }
        //   first.siblings.insertBefore(f.vInput!);
        //   second.siblings.insertBefore(f.vInput!);
        //   third.siblings.insertBefore(f.vInput!);
        matchedVInput.vInput!.siblings.remove();
      }
    }
  });

  fieldElement.addEventListener('keydown', (e) => {
    console.log('\n');
    switch (e.key) {
      case 'ArrowRight': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode?.meta.isOwn
        );

        toRight(e, ownCursors, field);
        break;
      }
      case 'ArrowLeft': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode?.meta.isOwn
        );

        toLeft(e, ownCursors, field);
        break;
      }
    }
  });

  fieldElement.addEventListener('mousemove', (e) => {
    // TODO: обработка выделения текста
  });

  fieldElement.addEventListener('mouseup', () => {
    // TODO: выход из режима выделения текста
  });

  hiddenInput.addEventListener('beforeinput', (e) => {
    e.preventDefault();
    console.log(e);

    if (e.dataTransfer) {
      for (let d of e.dataTransfer?.items) {
        d.getAsString(console.log);
      }
    }

    if (e.inputType === 'insertText') {
      const cursors = sortCursors(
        field.dataNode.cursors.filter((cursor) => cursor.meta.isOwn)
      );
      let spaceCount = 0;
      let prevCursor: Cursor | null = null;

      for (let cursor of cursors) {
        if (prevCursor?.input === cursor.input) {
          spaceCount += 1;
        } else {
          spaceCount = 0;
        }

        // cursor.input.content =
        //   cursor.input.content.substring(
        //     0,
        //     cursor.positionInInput + spaceCount
        //   ) +
        //   e.data +
        //   cursor.input.content.substring(cursor.positionInInput + spaceCount);

        cursor.input.insertText({
          data: e.data as string,
          position: cursor.positionInInput + spaceCount,
        });

        prevCursor = cursor;
        cursor.relativeTranslate(e.data!.length + spaceCount);
      }
    } else if (e.inputType === 'insertParagraph') {
      const cursors = sortCursors(
        field.dataNode.cursors.filter((cursor) => cursor.meta.isOwn)
      );
      const inputCursorGoups: Array<Cursor[]> = [];

      for (let cursor of cursors) {
        if (
          !inputCursorGoups.length ||
          inputCursorGoups[inputCursorGoups.length - 1][0].input !==
            cursor.input
        ) {
          inputCursorGoups.push([cursor]);
        } else {
          inputCursorGoups[inputCursorGoups.length - 1].push(cursor);
        }
      }
      console.log('[CURSOR GROUPS]', inputCursorGoups);
      for (let cursorGroup of inputCursorGoups) {
        for (
          let cursorIndex = cursorGroup.length - 1;
          cursorIndex >= 0;
          cursorIndex--
        ) {
          const cursor = cursorGroup[cursorIndex];

          const length = cursor.input.getIntoRowIndex(cursor.positionInInput);
          const newInputs = cursor.input.split(cursor.positionInInput);

          cursor.input.content = newInputs[0].content;

          const rightInputs =
            cursor.input.siblings.parent!.siblings.children.slice(
              cursor.input.siblings.indexOf() + 1
            );
          const newRow = new Row();

          newRow.siblings.insertAfter(cursor.input.siblings.parent!);
          newRow.siblings.appendChilds(newInputs[1], ...rightInputs);

          cursor.input = newInputs[1];
          cursor.positionInInput = 0;
          //cursor.translate(newInputs[1], 0);
        }
        for (let cursor of cursorGroup) {
          cursor.updatePosition();
        }
      }

      // console.log('newInputs', newInputs);
      // console.log(length);
      // const rows = cursor.input.siblings.parent!.split(length);

      // if (
      //   rows[rows.length - 1].siblings.children.length === 1 &&
      //   !rows[rows.length - 1].siblings.children[0].content
      // ) {
      //   rows[rows.length - 1].siblings.children[0].content = '\u200B';
      // }

      // if (
      //   rows[0].siblings.children.length === 1 &&
      //   !rows[0].siblings.children[0].content
      // ) {
      //   rows[0].siblings.children[0].content = '\u200B';
      // }

      // rows?.forEach((row) => {
      //   const ch = row.siblings.children;
      //   ch.forEach((i) => i.destruct());
      //   row.siblings.insertBefore(cursor.input.siblings.parent!);
      //   row.siblings.appendChilds(...ch);
      // });
      // console.log(rows);
      // cursor.input.siblings.parent?.destruct();
      // cursor.translate(rows[1].siblings.firstChild!, 0);
    } else if (e.inputType === 'insertFromPaste') {
      for (let d of e.dataTransfer!.items) {
        if (d.type === 'text/plain') {
          d.getAsString((data) => {
            const cursors = sortCursors(
              field.dataNode.cursors.filter((cursor) => cursor.meta.isOwn)
            );
            let spaceCount = 0;
            let prevCursor: Cursor | null = null;

            for (let cursor of cursors) {
              if (prevCursor?.input === cursor.input) {
                spaceCount += 1;
              } else {
                spaceCount = 0;
              }
              //   cursor.input.content =
              //     cursor.input.content.substring(0, cursor.positionInInput) +
              //     data +
              //     cursor.input.content.substring(cursor.positionInInput);

              cursor.input.insertText({
                data: data as string,
                position: cursor.positionInInput /*+ spaceCount*/,
              });

              prevCursor = cursor;
              cursor.relativeTranslate(data!.length + spaceCount);
            }
          });
          break;
        }
      }
    } else if (e.inputType === 'deleteContentBackward') {
      const cursors = field.dataNode.cursors.filter(
        (cursor) => cursor.meta.isOwn
      );

      for (let cursor of cursors) {
        if (cursor.positionInInput === 0 && !cursor.input.siblings.previous) {
          const prev = cursor.input.previousInput;
          const inputs = cursor.input.siblings.parent!.siblings.children;
          const emptyInput = cursor.input;
          const emptyRow = cursor.input.siblings.parent;

          if (prev) {
            cursor.translate(prev, prev.content.length);

            //emptyInput.destruct();
            emptyRow?.destruct();

            prev?.siblings.parent?.appendInputs(...inputs);
          }

          continue;
        }

        if (!cursor.input.content.length) {
          const prev = cursor.input;

          cursor.translate(
            prev.previousInput,
            prev.previousInput?.content.length,
            true
          );
          prev.siblings.parent.destruct();

          continue;
        }

        if (cursor.positionInInput === 0 && cursor.input.siblings.previous) {
          cursor.input = cursor.input.siblings.previous;
          cursor.positionInInput = cursor.input.content.length;
        }

        cursor.input.content =
          cursor.input.content.substring(0, cursor.positionInInput - 1) +
          cursor.input.content.substring(cursor.positionInInput);

        const currentInput = cursor.input;

        cursor.relativeTranslate(-1);

        // TODO: тоже специфичное поведение курсора на границах инпута, вынести в опции
        if (!currentInput.content.length) {
          currentInput.destruct();
        }

        if (cursor.positionInInput === 0) {
          if (!cursor.input.siblings.previous) {
            if (!cursor.input.content.length) {
              //cursor.input.content = '\u200B';
            }
          } else if (cursor.input.siblings.previous) {
            console.log(
              '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
            );
            const prev = cursor.input.siblings.previous;

            cursor.translate(prev, prev.content.length);
          }
        }
      }
    } else if (e.inputType === 'deleteContentForward') {
    }
  });

  field.dataNode.siblings.on('input:style:changed', (props, input) => {
    const element = field.dataInputToRenderMap.get(input)!.element!;

    for (let prop of props) {
      console.log(prop);
      element.style[prop.name] = prop.value;
    }
  });

  const paragraphs = text.split('\n');

  for (let p of paragraphs) {
    const row = new Row();
    field.appendRow(row);

    p.split(',').forEach((p) => {
      row.appendInputs(new Input(p));
    });
  }

  return {
    element: fieldElement,
    field,
  };
}
