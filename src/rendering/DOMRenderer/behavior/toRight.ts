import { RenderCursor } from '../RenderCursor';
import { RenderTextField } from '../RenderTextField';

export const toRight = <T extends object>(
  e: KeyboardEvent,
  cursors: RenderCursor<T>[],
  renderField: RenderTextField<T>
) => {
  for (let cursor of cursors) {
    if (e.ctrlKey) {
      let cursorOffset = 0;

      if (
        !cursor.dataNode!.input.siblings.next &&
        cursor.dataNode!.positionInInput ===
          cursor.dataNode!.input.content.length
      ) {
        cursor.dataNode!.relativeTranslate(1);

        continue;
      }

      renderField.dataNode.iterateContent(
        ({ symbol, symbolIndex, iterationIndex, input, row }, { end }) => {
          if (symbol === ' ') {
            console.log('space');
            end();
            cursorOffset = iterationIndex || 1;
          } else if (
            !input.siblings.next &&
            symbolIndex === input.content.length - 1
          ) {
            end();
            cursorOffset = iterationIndex + 1;
          } else if (
            !input.siblings.next &&
            symbolIndex === input.content.length
          ) {
            end();
            cursorOffset = 1;
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

      cursor.dataNode!.relativeTranslate(cursorOffset);
    } else {
      cursor.dataNode!.relativeTranslate(1);
    }
  }
};
