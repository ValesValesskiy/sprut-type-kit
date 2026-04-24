import { Input } from '../../../dataModel';
import { RenderCursor } from '../RenderCursor';
import { RenderInput } from '../RenderInput';
import { RenderTextField } from '../RenderTextField';
import { VRenderInput } from '../VRenderInput';
import { getVInputByInputSymbolIndex } from '../utils';

export const toRight = <T extends object>(
  e: KeyboardEvent,
  cursors: RenderCursor<T>[],
  renderField: RenderTextField<T>
) => {
  for (let cursor of cursors) {
    let currentVInputPosition = getVInputByInputSymbolIndex<T>(
      cursor.renderField.dataInputToRenderMap.get(cursor.dataNode.input)!,
      cursor.dataNode.positionInInput
    );

    if (
      e.ctrlKey &&
      !(
        currentVInputPosition.index ===
          currentVInputPosition.vInput?.content?.length &&
        !!currentVInputPosition.vInput?.siblings.next?.renderViewNode
      ) &&
      !currentVInputPosition.vInput?.renderViewNode
    ) {
      if (
        !cursor.dataNode!.input.siblings.next &&
        cursor.dataNode!.positionInInput ===
          cursor.dataNode!.input.content.length
      ) {
        cursor.dataNode!.relativeTranslate(1);

        continue;
      }

      if (
        !cursor.dataNode.input.siblings.previous &&
        cursor.dataNode.positionInInput === cursor.dataNode.input.content.length
      ) {
        cursor.dataNode.relativeTranslate(1);
      } else {
        const isSearchSpace =
          cursor.dataNode!.input.content[cursor.dataNode!.positionInInput] !==
          ' ';

        let currentInput: Input | undefined;
        let currentRenderInput: RenderInput<T> | undefined;
        let vInputs: VRenderInput<T>[] = [];

        renderField.dataNode.iterateContent(
          ({ symbol, symbolIndex, iterationIndex, input, row }, { end }) => {
            if (currentInput !== input) {
              currentInput = input;
              currentRenderInput =
                cursor.renderField.dataInputToRenderMap.get(input)!;
              vInputs = currentRenderInput.siblings.children.filter(
                ({ renderViewNode }) => renderViewNode
              );
            }

            if (
              vInputs.length &&
              symbolIndex < vInputs[0].startIndex + vInputs[0].length &&
              symbolIndex >= vInputs[0].startIndex
            ) {
              end();
              cursor.dataNode.translate(input, symbolIndex);
              //vInputs[vInputs.length - 1].focus?.();
              return;
            }

            if (
              (symbol === ' ' && isSearchSpace) ||
              (symbol !== ' ' && !isSearchSpace)
            ) {
              console.log('space');
              end();
              cursor.dataNode.translate(input, symbolIndex);
            } else if (
              !input.siblings.next &&
              symbolIndex === input.content.length - 1
            ) {
              end();
              cursor.dataNode.translate(input, symbolIndex + 1);
            }

            console.log(
              'Iteration[',
              iterationIndex,
              ']:',
              symbolIndex,
              input.content.length
            );
          },
          {
            from: {
              input: cursor.dataNode!.input,
              index: cursor.dataNode!.positionInInput,
              row: cursor.dataNode!.input.siblings.parent!,
            },
          }
        );
      }
    } else {
      const a = cursor.getVInputByCursorPosition();

      if (a.vInput?.renderViewNode) {
        a.vInput.blur?.();

        cursor.dataNode.positionInInput = a.vInput.startIndex + a.vInput.length;
        cursor.dataNode.updatePosition();
      } else {
        cursor.dataNode!.relativeTranslate(1);
      }
      const i = cursor.getVInputByCursorPosition();

      if (i.vInput?.renderViewNode) {
        if (a.vInput !== i.vInput) {
          i.vInput.focus?.();
        } else {
        }
      }
      //cursor.dataNode!.relativeTranslate(1);
    }

    // TODO: поведение курсора на границах
    // if (
    //   cursor.dataNode.positionInInput === 0 &&
    //   cursor.dataNode.input.siblings.previous
    // ) {
    //   cursor.dataNode.translate(cursor.dataNode.input.siblings.previous, 0);
    // }
  }
};
