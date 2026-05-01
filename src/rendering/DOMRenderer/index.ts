import { RenderCursor } from './RenderCursor';
import { RenderInput } from './RenderInput';
import { RenderRow } from './RenderRow';
import { RenderTextField } from './RenderTextField';
import { VRenderInput } from './VRenderInput';
import { toLeft, toRight } from './behavior';
import {
  allScrollOffsetLeft,
  allScrollOffsetTop,
  drawRoundLines,
  drawRoundRect,
  getVInputRectByCursorPosition,
  getSortedForSelection,
  getVInputByInputSymbolIndex,
  getVRenderInputByClientCoords,
  getVInputElement,
} from './utils';

import {
  Input,
  Row,
  Cursor,
  sortCursors,
  TextSelection,
  collapseFromTo,
} from '../../dataModel';

export function createField({ text }: { text: string }) {
  let isMouseSelectionMode = false;
  let activeCursor: RenderCursor<HTMLElement> | null = null;

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

  const backCanvas = document.createElement('canvas');
  const frontCanvas = document.createElement('canvas');
  const backCanvasContext = backCanvas.getContext('2d')!;
  const frontCanvasContext = frontCanvas.getContext('2d')!;

  if (!backCanvasContext || !frontCanvasContext) {
    throw new Error('');
  }

  backCanvas.classList.add('canvas', 'back-canvas');
  frontCanvas.classList.add('canvas', 'front-canvas');

  backCanvas.getContext('2d')!.fillStyle = '#3377cc';

  fieldElement.append(backCanvas);
  fieldElement.append(frontCanvas);

  field.element = fieldElement;

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const newHeight = entry.contentRect.height;
      const newWidth = entry.contentRect.width;

      backCanvas.height = newHeight;
      backCanvas.width = newWidth;

      redrawAllSelections();
    }
  });

  // Начинаем слежение
  resizeObserver.observe(fieldElement);

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

  field.on(
    'cursor:translate',
    function (
      renderCursor,
      { renderInput },
      { renderInput: prevInput, positionInInput: prevPosition }
    ) {
      let { vInput, index } = renderCursor.getVInputByCursorPosition();
      const prevVInput = getVInputByInputSymbolIndex(
        prevInput,
        prevPosition
      ).vInput;

      console.log(renderCursor.dataNode, vInput, index);
      if (!vInput) {
        throw new Error('');
      }

      /* Если мы в начале инпута и есть предыдущий сосед */
      const isStartWithPrevioius = index === 0 && vInput.siblings.previous;

      if (prevVInput) {
        prevVInput.blur?.();
      }

      if (vInput.renderViewNode && !isStartWithPrevioius) {
        renderCursor.element!.style.display = 'none';

        vInput.focus?.();
      } else {
        if (vInput.renderViewNode && isStartWithPrevioius) {
          vInput = vInput.siblings.previous!;
          index = vInput.length;
        }

        const rect = getVInputRectByCursorPosition(
          vInput.element!.firstChild!,
          index
        )[0];

        renderCursor.element!.style.display = 'block';
        renderCursor.element!.style.position = 'absolute';
        renderCursor.element!.style.left =
          rect.left -
          allScrollOffsetLeft(renderCursor.element!) -
          fieldElement.getBoundingClientRect().left +
          window.scrollX +
          'px';
        renderCursor.element!.style.top =
          rect.top -
          allScrollOffsetTop(renderCursor.element!) -
          fieldElement.getBoundingClientRect().top +
          window.scrollY +
          'px';
        renderCursor.element!.style.width = rect.width + 'px';
        renderCursor.element!.style.height = rect.height + 'px';
      }
    }
  );

  field.on('cursor:remove', function (renderCursor) {
    renderCursor.element?.remove();
  });

  fieldElement.addEventListener('mousedown', function (e) {
    isMouseSelectionMode = true;

    const { vRenderInput, caretPosition } = getVRenderInputByClientCoords(
      field,
      { x: e.clientX, y: e.clientY }
    );

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

      clearBackCanvas();
    }

    // TODO: Работа с индексами внутренних инпутов для вычисления оффсета, потому в caretPosition позиция курсора внутри vInput
    newCursor.translate(
      renderInput!.dataNode!,
      renderInput!.dataNode!.content.length === 0
        ? 0
        : caretPosition?.offset! + vRenderInput?.startIndex!
    );

    activeCursor = field.dataCursorToRenderMap.get(newCursor)!;
    activeCursor.dataNode.selection.reset(
      newCursor.input,
      newCursor.positionInInput
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
        second.textInputDisabled = true;

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

  field.on('input:mutation:remove', (renderInput, { from, to }) => {
    const { vInput: startVInput, index: startIndex } =
      getVInputByInputSymbolIndex(renderInput, from);
    const { vInput: finishVInput, index: finishIndex } =
      getVInputByInputSymbolIndex(renderInput, to);
    let current = startVInput?.siblings.next;
    console.log(startVInput, finishVInput, from, to, '!!!!!!!!!!!!!!!!!!!');
    while (current && current !== finishVInput) {
      const next = current.nextInput;

      current.siblings.remove();

      current = next;
    }

    if (startVInput !== finishVInput) {
      startVInput!.element!.innerText =
        renderInput.dataNode!.content!.substring(
          startVInput!.startIndex!,
          from
        );
      finishVInput!.element!.innerText =
        renderInput.dataNode!.content!.substring(
          to,
          finishVInput!.startIndex! + finishVInput!.length
        );
    } else {
      startVInput!.element!.innerText =
        renderInput.dataNode!.content!.substring(
          startVInput!.startIndex!,
          from
        ) +
        renderInput.dataNode!.content!.substring(
          to,
          startVInput!.startIndex! + startVInput!.length
        );
    }
  });

  fieldElement.addEventListener('keydown', (e) => {
    console.log('\n');
    switch (e.key) {
      case 'ArrowRight': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode?.meta.isOwn
        );

        for (let cursor of ownCursors) {
          const selection = cursor.dataNode.selection;

          if (e.shiftKey) {
            if (!selection.getHasSelection()) {
              selection.finishInput = cursor.dataNode.input;
              selection.finishIndex = cursor.dataNode.positionInInput;
            }

            toRight(e, cursor);

            selection.startInput = cursor.dataNode.input;
            selection.startIndex = cursor.dataNode.positionInInput;
          } else {
            if (cursor.dataNode.selection.getHasSelection()) {
              const { last, lastIndex } = getSortedForSelection(
                cursor.dataNode.selection
              );

              cursor.dataNode.translate(last, lastIndex);

              cursor.dataNode.selection.reset(last, lastIndex);

              cursor.lastXPosition = cursor.element!.offsetLeft;

              continue;
            }

            toRight(e, cursor);

            cursor.dataNode.selection.reset(
              cursor.dataNode.input,
              cursor.dataNode.positionInInput
            );
          }

          cursor.lastXPosition = cursor.element!.offsetLeft;
        }

        redrawAllSelections();
        break;
      }
      case 'ArrowLeft': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode?.meta.isOwn
        );

        for (let cursor of ownCursors) {
          const selection = cursor.dataNode.selection;

          if (e.shiftKey) {
            if (!selection.getHasSelection()) {
              selection.finishInput = cursor.dataNode.input;
              selection.finishIndex = cursor.dataNode.positionInInput;
            }

            toLeft(e, cursor);

            selection.startInput = cursor.dataNode.input;
            selection.startIndex = cursor.dataNode.positionInInput;
          } else {
            if (cursor.dataNode.selection.getHasSelection()) {
              const { first, firstIndex } = getSortedForSelection(
                cursor.dataNode.selection
              );

              cursor.dataNode.translate(first, firstIndex);

              cursor.dataNode.selection.reset(first, firstIndex);

              cursor.lastXPosition = cursor.element!.offsetLeft;

              continue;
            }

            toLeft(e, cursor);

            cursor.dataNode.selection.reset(
              cursor.dataNode.input,
              cursor.dataNode.positionInInput
            );
          }

          cursor.lastXPosition = cursor.element!.offsetLeft;
        }

        redrawAllSelections();
        break;
      }
      case 'ArrowUp': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode!.meta.isOwn
        );

        for (let cursor of ownCursors) {
          let currentInputPosition = cursor.getVInputByCursorPosition()!;
          let currentRect = currentInputPosition.vInput?.renderViewNode
            ? currentInputPosition.vInput.element!.getBoundingClientRect()
            : getVInputRectByCursorPosition(
                currentInputPosition.vInput!.element!.firstChild!,
                currentInputPosition.index
              )[0];

          document.body.style.setProperty(
            'pointer-events',
            'none',
            'important'
          );
          fieldElement.style.setProperty('pointer-events', 'auto', 'important');

          const caretPosition = document.caretPositionFromPoint(
            cursor.lastXPosition +
              allScrollOffsetLeft(fieldElement) +
              fieldElement.getBoundingClientRect().left -
              window.scrollX,
            currentRect.top - currentRect.height / 2
          );

          if (
            caretPosition?.offsetNode != undefined &&
            cursor.dataNode.input.siblings.parent!.siblings.previous
          ) {
            const vInput = getVInputElement(field, caretPosition.offsetNode);

            if (vInput) {
              if (vInput.renderViewNode) {
                cursor.dataNode.translate(
                  vInput.siblings.parent!.dataNode!,
                  vInput.startIndex + vInput.length / 2
                );
              } else {
                cursor.dataNode.translate(
                  vInput.siblings.parent!.dataNode!,
                  vInput.startIndex + caretPosition.offset
                );
              }
            }
          } else {
            cursor.dataNode.translate(
              cursor.dataNode.input.siblings.parent!.siblings.children[0],
              0
            );
          }

          document.body.style.setProperty('pointer-events', '', '');
          fieldElement.style.setProperty('pointer-events', '', '');

          cursor.dataNode.selection.reset(
            cursor.dataNode.input,
            cursor.dataNode.positionInInput
          );
        }

        redrawAllSelections();

        break;
      }
      case 'ArrowDown': {
        const ownCursors = field.cursors.filter(
          (cursor) => cursor.dataNode!.meta.isOwn
        );

        for (let cursor of ownCursors) {
          let currentInputPosition = cursor.getVInputByCursorPosition()!;
          let currentRect = currentInputPosition.vInput?.renderViewNode
            ? currentInputPosition.vInput.element!.getBoundingClientRect()
            : getVInputRectByCursorPosition(
                currentInputPosition.vInput!.element!.firstChild!,
                currentInputPosition.index
              )[0];

          document.body.style.setProperty(
            'pointer-events',
            'none',
            'important'
          );
          fieldElement.style.setProperty('pointer-events', 'auto', 'important');

          const caretPosition = document.caretPositionFromPoint(
            cursor.lastXPosition +
              allScrollOffsetLeft(fieldElement) +
              fieldElement.getBoundingClientRect().left -
              window.scrollX,
            currentRect.top + currentRect.height + currentRect.height / 2
          );

          if (
            caretPosition?.offsetNode != undefined &&
            cursor.dataNode.input.siblings.parent!.siblings.next
          ) {
            console.log(caretPosition, currentRect);
            const vInput = getVInputElement(field, caretPosition.offsetNode);

            if (vInput) {
              if (vInput.renderViewNode) {
                cursor.dataNode.translate(
                  vInput.siblings.parent!.dataNode!,
                  vInput.startIndex + vInput.length / 2
                );
              } else {
                console.log(vInput);
                cursor.dataNode.translate(
                  vInput.siblings.parent!.dataNode!,
                  vInput.startIndex + caretPosition.offset
                );
              }
            }
          } else {
            const rowInputs =
              cursor.dataNode.input.siblings.parent!.siblings.children;

            cursor.dataNode.translate(
              rowInputs[rowInputs.length - 1],
              rowInputs[rowInputs.length - 1].content.length
            );
          }

          document.body.style.setProperty('pointer-events', '', '');
          fieldElement.style.setProperty('pointer-events', '', '');

          cursor.dataNode.selection.reset(
            cursor.dataNode.input,
            cursor.dataNode.positionInInput
          );
        }

        redrawAllSelections();

        break;
      }
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseSelectionMode && activeCursor) {
      const { caretPosition, vRenderInput } = getVRenderInputByClientCoords(
        field,
        { x: e.clientX, y: e.clientY }
      );

      if (!vRenderInput) {
        throw new Error('');
      }

      if (
        !activeCursor.dataNode.selection.finishInput &&
        activeCursor.dataNode.selection.finishIndex == undefined
      ) {
        activeCursor.dataNode.selection.finishInput =
          activeCursor.dataNode.selection.startInput;
        activeCursor.dataNode.selection.finishIndex =
          activeCursor.dataNode.selection.startIndex;
      }

      activeCursor.dataNode.selection.startInput =
        vRenderInput.siblings.parent!.dataNode!;
      activeCursor.dataNode.selection.startIndex =
        vRenderInput.startIndex + caretPosition?.offset!;

      activeCursor.dataNode.translate(
        activeCursor.dataNode.selection.startInput,
        activeCursor.dataNode.selection.startIndex
      );

      redrawAllSelections();
    }
  });

  function redrawAllSelections() {
    clearBackCanvas();

    for (let cursor of field.cursors) {
      drawSelection(cursor.dataNode.selection);
    }
  }

  function drawSelection(selection: TextSelection) {
    if (!selection.getHasSelection()) {
      return;
    }

    const { first, firstIndex, last, lastIndex } =
      getSortedForSelection(selection);

    const firstVInput = getVInputByInputSymbolIndex<HTMLElement>(
      field.dataInputToRenderMap.get(first)!,
      firstIndex!
    );
    const lastVInput = getVInputByInputSymbolIndex<HTMLElement>(
      field.dataInputToRenderMap.get(last)!,
      lastIndex!
    );

    const range = document.createRange();
    let current = firstVInput.vInput?.nextInput;
    const rects2: DOMRect[] = [];

    if (firstVInput.vInput !== lastVInput.vInput) {
      range.setStart(
        firstVInput.vInput!.element!.firstChild!,
        firstVInput.index
      );
      range.setEnd(
        firstVInput.vInput!.element!.firstChild!,
        firstVInput.vInput!.length
      );

      rects2.push(range.getBoundingClientRect());

      while (current && current !== lastVInput.vInput) {
        if (!current.renderViewNode) {
          range.setStart(current.element!.firstChild!, 0);
          range.setEnd(current.element!.firstChild!, current.length);

          rects2.push(range.getBoundingClientRect());
        }

        current = current.nextInput;
      }

      range.setStart(lastVInput.vInput!.element!.firstChild!, 0);
      range.setEnd(lastVInput.vInput!.element!.firstChild!, lastVInput.index);

      rects2.push(range.getBoundingClientRect());
    } else {
      range.setStart(
        firstVInput.vInput!.element!.firstChild!,
        firstVInput.index
      );
      range.setEnd(lastVInput.vInput!.element!.firstChild!, lastVInput.index);

      rects2.push(range.getBoundingClientRect());
    }

    const rects = [...range.getClientRects()].filter(
      (rect, index, self) =>
        rect.width > 0 &&
        rect.height > 0 &&
        index ===
          self.findIndex(
            (r) =>
              r.top === rect.top &&
              r.left === rect.left &&
              r.width === rect.width &&
              r.height === rect.height
          )
    );
    console.log(rects);
    const points = [];

    // TODO: перевести на drawRoundLines, собрать ректы итеративно для каждого элемента с отсеиванием рендеров, далее склейка в непрерывные линии
    //drawRoundLines(ctx, [], 2);
    backCanvasContext.moveTo(
      rects2[0].x -
        allScrollOffsetLeft(fieldElement) -
        fieldElement.getBoundingClientRect().left +
        window.scrollX,
      rects2[0].y -
        allScrollOffsetTop(fieldElement) -
        fieldElement.getBoundingClientRect().top +
        window.scrollY
    );
    backCanvasContext.beginPath();
    for (let rect of rects2) {
      backCanvasContext.fillStyle = '#50b6cf';
      backCanvasContext.moveTo(
        rect.x -
          allScrollOffsetLeft(fieldElement) -
          fieldElement.getBoundingClientRect().left +
          window.scrollX,
        rect.y -
          allScrollOffsetTop(fieldElement) -
          fieldElement.getBoundingClientRect().top +
          window.scrollY
      );
      drawRoundRect(
        backCanvasContext,
        rect.x -
          allScrollOffsetLeft(fieldElement) -
          fieldElement.getBoundingClientRect().left +
          window.scrollX,
        rect.y -
          allScrollOffsetTop(fieldElement) -
          fieldElement.getBoundingClientRect().top +
          window.scrollY,
        rect.width,
        rect.height,
        4
      );
    }
    backCanvasContext.closePath();
    backCanvasContext.fill();
  }

  window.addEventListener('mouseup', () => {
    isMouseSelectionMode = false;
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

        if (cursor.selection.getHasSelection()) {
          const { first, firstIndex, last, lastIndex } = getSortedForSelection(
            cursor.selection
          );

          collapseFromTo(first, firstIndex, last, lastIndex, true);

          first.insertText({ data: e.data!, position: firstIndex });

          if (!last.content.length) {
            last.siblings.remove();
          }

          cursor.translate(first, firstIndex + 1);
        } else {
          const { vInput, index } = getVInputByInputSymbolIndex(
            field.dataInputToRenderMap.get(cursor.input)!,
            cursor.positionInInput
          );

          if (vInput?.textInputDisabled) {
            cursor.relativeTranslate(spaceCount);
          } else {
            cursor.input.insertText({
              data: e.data as string,
              position: cursor.positionInInput + spaceCount,
            });

            cursor.relativeTranslate(e.data!.length + spaceCount);
          }
        }

        cursor.selection.reset(cursor.input, cursor.positionInInput);

        prevCursor = cursor;
      }

      redrawAllSelections();
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

          if (cursor.selection.getHasSelection()) {
            const { first, firstIndex, last, lastIndex } =
              getSortedForSelection(cursor.selection);

            const row = last.siblings.parent!;

            collapseFromTo(first, firstIndex, last, lastIndex);

            //first.insertText({ data: e.data!, position: firstIndex });
            cursor.translate(row.siblings.children[0], 0);
            cursor.selection.reset(cursor.input, cursor.positionInInput);
          } else {
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
        }
        for (let cursor of cursorGroup) {
          cursor.updatePosition();
        }
      }

      redrawAllSelections();

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

            for (let group of inputCursorGoups) {
              for (let i = 0; i < group.length; i++) {
                const cursor = group[i];

                if (cursor.selection.getHasSelection()) {
                  const { first, firstIndex, last, lastIndex } =
                    getSortedForSelection(cursor.selection);

                  const row = last.siblings.parent!;

                  collapseFromTo(first, firstIndex, last, lastIndex, true);

                  cursor.selection.reset(cursor.input, cursor.positionInInput);
                }

                // TODO: в будущем разбивать линейной итерацией вне специальных символов, чтобы не повредить данные, например, рендеров
                const dataParts = data
                  .split('\n')
                  .map((s) => s.replaceAll(/\r/g, ''));
                console.log(data, dataParts);

                cursor.input.insertText({
                  data: dataParts[0],
                  position: cursor.positionInInput,
                });

                cursor.relativeTranslate(dataParts[0].length);

                for (let j = i + 1; j < group.length; j++) {
                  group[j].positionInInput += dataParts[0].length;
                }

                const insertAfterRow = cursor.input.siblings.parent!;

                if (dataParts.length > 1) {
                  const rightInputs: Input[] = [];
                  let currentInput = cursor.input.siblings.next;

                  if (
                    cursor.positionInInput !== 0 &&
                    cursor.positionInInput !== cursor.input.content.length
                  ) {
                    const inputParts = cursor.input.split(
                      cursor.positionInInput
                    );

                    cursor.input.content = inputParts[0].content;

                    rightInputs.push(inputParts[1]);
                  }

                  while (currentInput) {
                    rightInputs.push(currentInput);

                    currentInput = currentInput.siblings.next;
                  }

                  const newRow = new Row();

                  newRow.siblings.insertAfter(cursor.input.siblings.parent!);
                  newRow.appendInputs(...rightInputs);

                  newRow.siblings.children[0].insertText({
                    data: dataParts[dataParts.length - 1],
                    position: 0,
                  });

                  cursor.translate(
                    rightInputs[0],
                    dataParts[dataParts.length - 1].length
                  );
                }

                // Далее не пользуемся координатами из курсора, он в финальном положении

                for (let i = dataParts.length - 2; i >= 1; i--) {
                  const newRow = new Row();
                  const newInput = new Input('');

                  newRow.siblings.insertAfter(insertAfterRow);
                  newRow.appendInputs(newInput);

                  newInput.insertText({
                    data: dataParts[i],
                    position: 0,
                  });
                }
              }
            }
          });
          break;
        }
      }
    } else if (e.inputType === 'deleteContentBackward') {
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

      let spaceCount = 0;
      let prevCursor: Cursor | null = null;

      for (let group of inputCursorGoups) {
        for (let i = 0; i < group.length; i++) {
          const cursor = group[i];

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

          if (cursor.selection.getHasSelection()) {
            const { first, firstIndex, last, lastIndex } =
              getSortedForSelection(cursor.selection);

            const selectionLength = cursor.selection.length;

            collapseFromTo(first, firstIndex, last, lastIndex, true);

            first.insertText({ data: '', position: firstIndex });

            if (!last.content.length) {
              last.siblings.remove();
            }

            cursor.translate(first, firstIndex, true);

            cursor.selection.reset(first, firstIndex);

            for (let j = i + 1; j < group.length; j++) {
              group[j].positionInInput -= selectionLength;
            }

            prevCursor = cursor;
          } else {
            for (let j = i + 1; j < group.length; j++) {
              group[j].positionInInput -= cursor.positionInInput === 0 ? 0 : 1;
            }

            if (
              cursor.positionInInput === 0 &&
              !cursor.input.siblings.previous
            ) {
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

              if (prev.previousInput) {
                cursor.translate(
                  prev.previousInput,
                  prev.previousInput?.content.length,
                  true
                );
                prev.siblings.parent!.destruct();
              }

              continue;
            }

            if (
              cursor.positionInInput === 0 &&
              cursor.input.siblings.previous
            ) {
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
        }
      }

      for (let cursor of cursors) {
        cursor.updatePosition();
      }

      redrawAllSelections();
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

  requestAnimationFrame(() => {
    backCanvas.width = fieldElement.offsetWidth;
    backCanvas.height = fieldElement.offsetHeight;
  });

  return {
    element: fieldElement,
    field,
  };

  function clearBackCanvas() {
    backCanvasContext.clearRect(0, 0, backCanvas.width, backCanvas.height);
  }
}
