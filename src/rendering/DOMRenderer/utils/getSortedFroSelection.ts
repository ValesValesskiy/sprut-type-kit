import { Input, TextSelection } from '../../../dataModel';

export function getSortedForSelection(selection: TextSelection) {
  if (!selection.getHasSelection()) {
    throw new Error('');
  }

  const { startInput, startIndex, finishInput, finishIndex } = selection;

  let first: Input;
  let last: Input | undefined = undefined;
  let firstIndex: number;
  let lastIndex: number;

  if (selection.startInput === selection.finishInput) {
    first = startIndex < finishIndex ? startInput : finishInput;
    last = startIndex < finishIndex ? finishInput : startInput;
    firstIndex = startIndex < finishIndex ? startIndex : finishIndex;
    lastIndex = startIndex < finishIndex ? finishIndex : startIndex;
  } else if (startInput.siblings.parent === finishInput.siblings.parent) {
    first =
      startInput.siblings.indexOf() < finishInput.siblings.indexOf()
        ? startInput
        : finishInput;
  } else {
    first =
      startInput.siblings.parent!.siblings.indexOf() <
      finishInput.siblings.parent!.siblings.indexOf()
        ? startInput
        : finishInput;
  }

  if (!last) {
    last = first === startInput ? finishInput : startInput;
    firstIndex = first === startInput ? startIndex : finishIndex;
    lastIndex = first === startInput ? finishIndex : startIndex;
  }

  return { first, firstIndex: firstIndex!, last, lastIndex: lastIndex! };
}
