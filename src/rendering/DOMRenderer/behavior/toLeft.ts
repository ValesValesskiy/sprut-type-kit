import { RenderCursor } from '../RenderCursor';
import { RenderTextField } from '../RenderTextField';

export const toLeft = <T extends object>(
  e: KeyboardEvent,
  cursors: RenderCursor<T>[],
  renderField: RenderTextField<T>
) => {
  for (let cursor of cursors) {
    if (e.ctrlKey) {
      let cursorOffset = 0;

      if (
        !cursor.dataNode!.input.siblings.previous &&
        cursor.dataNode!.positionInInput === 0
      ) {
        cursor.dataNode!.relativeTranslate(-1);

        continue;
      }

      renderField.dataNode.iterateContent(
        ({ symbol, symbolIndex, iterationIndex, input, row }, { end }) => {
          if (symbol === ' ') {
            console.log('space');
            end();
            cursorOffset = iterationIndex ? iterationIndex : 1;
          } else if (!input.siblings.previous && symbolIndex === 0) {
            end();
            cursorOffset = 1;
          } else if (!input.siblings.previous && symbolIndex === 1) {
            end();
            cursorOffset = iterationIndex + 2;
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
          arrow: -1,
          from: {
            input: cursor.dataNode!.input,
            index: cursor.dataNode!.positionInInput - 1,
            row: cursor.dataNode!.input.siblings.parent!,
          },
        }
      );

      cursor.dataNode!.relativeTranslate(-cursorOffset);
    } else {
      cursor.dataNode!.relativeTranslate(-1);
    }
  }
};
