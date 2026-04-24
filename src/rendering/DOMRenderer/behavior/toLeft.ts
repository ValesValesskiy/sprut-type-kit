import { Input } from '../../../dataModel';
import { RenderCursor } from '../RenderCursor';
import { RenderInput } from '../RenderInput';
import { RenderTextField } from '../RenderTextField';
import { VRenderInput } from '../VRenderInput';
import {
  getVInputByInputSymbolIndex,
  iterateContentByCheckSymbolGroup,
} from '../utils';

export const toLeft = <T extends object>(
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
        currentVInputPosition.index === 0 &&
        !!currentVInputPosition.vInput?.siblings.previous?.renderViewNode
      ) &&
      !currentVInputPosition.vInput?.renderViewNode
    ) {
      if (
        !cursor.dataNode!.input.siblings.previous &&
        cursor.dataNode!.positionInInput === 0
      ) {
        cursor.dataNode!.relativeTranslate(-1);

        continue;
      }

      if (
        !cursor.dataNode.input.siblings.previous &&
        cursor.dataNode.positionInInput === 0
      ) {
        cursor.dataNode.relativeTranslate(-1);
      } else {
        const cursorPosition = iterateContentByCheckSymbolGroup({
          renderField,
          input: cursor.dataNode.input,
          positionInInput: cursor.dataNode.positionInInput,
          arrow: -1,
          getSymbolGroup: (symbol) =>
            /\d/.test(symbol) ? 1 : symbol === ' ' ? 2 : 3,
        });

        if (cursorPosition) {
          cursor.dataNode.translate(
            cursorPosition?.input,
            cursorPosition?.positionInInput
          );
        } else {
          throw new Error('');
        }
      }
    } else {
      const a = cursor.getVInputByCursorPosition();

      if (a.vInput?.renderViewNode) {
        a.vInput.blur?.();

        cursor.dataNode.positionInInput = a.vInput.startIndex ?? 0;
        cursor.dataNode.updatePosition();
      } else {
        cursor.dataNode!.relativeTranslate(-1);
      }
      const i = cursor.getVInputByCursorPosition();

      if (i.vInput?.renderViewNode) {
        if (a.vInput !== i.vInput) {
          i.vInput.focus?.();
        } else {
        }
      }
    }

    // TODO: поведение курсора на границах
    // if (
    //   cursor.dataNode.positionInInput === 0 &&
    //   cursor.dataNode.input.siblings.previous
    // ) {
    //   cursor.dataNode.translate(
    //     cursor.dataNode.input.siblings.previous,
    //     cursor.dataNode.input.siblings.previous.content.length
    //   );
    // }
  }
};
