import { Input } from '../Input';
import { Row } from '../Row';

export function collapseFromTo(
  first: Input,
  firstIndex: number,
  last: Input,
  lastIndex: number,
  mergeRows?: boolean
) {
  let currentInput = first === last ? first : first.nextInput;
  let shouldMergeRow: Row | undefined =
    first.siblings.parent !== last.siblings.parent
      ? last.siblings.parent!
      : undefined;

  while (currentInput && currentInput !== last) {
    const next = currentInput.nextInput;

    if (currentInput.siblings.parent?.siblings.children.length === 1) {
      currentInput.siblings.parent?.siblings.remove();
    } else {
      currentInput.siblings.remove();
    }

    currentInput = next;
  }

  if (first !== last) {
    first.removeText(firstIndex);
    last.removeText(0, lastIndex);
  } else {
    first.removeText(firstIndex, lastIndex);
  }

  if (shouldMergeRow && mergeRows) {
    first.siblings.parent!.appendInputs(...shouldMergeRow.siblings.children);
    shouldMergeRow.siblings.remove();
  }
}
