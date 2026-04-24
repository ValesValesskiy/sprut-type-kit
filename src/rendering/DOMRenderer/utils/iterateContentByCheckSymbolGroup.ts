import { Input } from '../../../dataModel';
import { RenderInput } from '../RenderInput';
import { RenderTextField } from '../RenderTextField';
import { VRenderInput } from '../VRenderInput';

export type TGetSymbolGroup = (symbol: string) => string | number;
type ResultPosition = { input: Input; positionInInput: number } | undefined;

export const iterateContentByCheckSymbolGroup = <T extends object>({
  renderField,
  input,
  positionInInput,
  getSymbolGroup,
  arrow,
}: {
  renderField: RenderTextField<T>;
  input: Input;
  positionInInput: number;
  getSymbolGroup: TGetSymbolGroup;
  arrow: 1 | -1;
}): ResultPosition => {
  let firstGroup: ReturnType<typeof getSymbolGroup>;

  let currentInput: Input | undefined;
  let currentRenderInput: RenderInput<T> | undefined;
  let vInputs: VRenderInput<T>[] = [];

  let result: ResultPosition;

  if (arrow === 1) {
    renderField.dataNode.iterateContent(
      ({ symbol, symbolIndex, iterationIndex, input, row }, { end }) => {
        if (!firstGroup) {
          firstGroup = getSymbolGroup(input.content[symbolIndex]);
        }

        if (currentInput !== input) {
          currentInput = input;
          currentRenderInput = renderField.dataInputToRenderMap.get(input)!;
          vInputs = currentRenderInput.siblings.children.filter(
            ({ renderViewNode }) => renderViewNode
          );
        }

        if (
          vInputs.length &&
          vInputs.find(
            ({ startIndex, length }) =>
              symbolIndex < startIndex + length && symbolIndex >= startIndex
          )
        ) {
          end();
          result = { input, positionInInput: symbolIndex };

          return;
        }

        if (firstGroup !== getSymbolGroup(symbol)) {
          console.log('space');
          end();

          result = { input, positionInInput: symbolIndex };

          return;
        } else if (
          !input.siblings.next &&
          symbolIndex === input.content.length - 1
        ) {
          end();

          result = { input, positionInInput: symbolIndex + 1 };

          return;
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
        arrow,
        from: {
          input: input,
          index: positionInInput,
          row: input.siblings.parent!,
        },
      }
    );
  } else {
    renderField.dataNode.iterateContent(
      ({ symbol, symbolIndex, iterationIndex, input, row }, { end }) => {
        if (!firstGroup) {
          firstGroup = getSymbolGroup(input.content[symbolIndex]);
        }

        if (currentInput !== input) {
          currentInput = input;
          currentRenderInput = renderField.dataInputToRenderMap.get(input)!;
          vInputs = currentRenderInput.siblings.children.filter(
            ({ renderViewNode }) => renderViewNode
          );
        }

        if (
          vInputs.length &&
          vInputs.find(
            ({ startIndex, length }) =>
              symbolIndex < startIndex + length && symbolIndex >= startIndex
          )
        ) {
          end();

          result = { input, positionInInput: symbolIndex + 1 };

          return;
        }

        if (firstGroup !== getSymbolGroup(symbol)) {
          console.log('space');
          end();

          result = { input, positionInInput: symbolIndex + 1 };

          return;
        } else if (!input.siblings.previous && symbolIndex === 0) {
          end();

          result = { input, positionInInput: 0 };

          return;
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
        arrow,
        from: {
          input: input,
          index: positionInInput - 1,
          row: input.siblings.parent!,
        },
      }
    );
  }

  return result;
};
