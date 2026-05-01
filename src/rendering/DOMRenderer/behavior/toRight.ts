import { RenderCursor } from '../RenderCursor';
import {
  getVInputByInputSymbolIndex,
  iterateContentByCheckSymbolGroup,
} from '../utils';

export const toRight = <T extends object>(
  e: KeyboardEvent,
  cursor: RenderCursor<T>
) => {
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
      cursor.dataNode!.positionInInput === cursor.dataNode!.input.content.length
    ) {
      cursor.dataNode!.relativeTranslate(1);

      return;
    }

    if (
      !cursor.dataNode.input.siblings.previous &&
      cursor.dataNode.positionInInput === cursor.dataNode.input.content.length
    ) {
      cursor.dataNode.relativeTranslate(1);
    } else {
      const cursorPosition = iterateContentByCheckSymbolGroup({
        renderField: cursor.renderField,
        input: cursor.dataNode.input,
        positionInInput: cursor.dataNode.positionInInput,
        arrow: 1,
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

      // if (
      //   a.vInput.startIndex + a.vInput.length ===
      //   cursor.dataNode.input.content.length
      // ) {
      //   const range = document.createRange();

      //   range.setStart(a.vInput.siblings.next!.element!.firstChild!, 0);
      //   range.setEnd(a.vInput.siblings.next!.element!.firstChild!, 0);
      //   const rect = range.getBoundingClientRect();

      //   cursor.element!.style.display = 'block';
      //   cursor.element!.style.position = 'absolute';
      //   cursor.element!.style.left = rect.left + 'px';
      //   cursor.element!.style.top = rect.top + 'px';
      //   cursor.element!.style.width = rect.width + 'px';
      //   cursor.element!.style.height = rect.height + 'px';

      //   cursor.dataNode.positionInInput =
      //     a.vInput.startIndex + a.vInput.length;
      //   return;
      // }
      cursor.dataNode.positionInInput = a.vInput.startIndex + a.vInput.length;
      cursor.dataNode.updatePosition();
    } else {
      cursor.dataNode!.relativeTranslate(1 /*true*/); // По условию стратегии управления курсором
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
};
