import { RenderInput } from '../RenderInput';
import { VRenderInput } from '../VRenderInput';

export const getVInputByInputSymbolIndex = <T extends object>(
  renderInput: RenderInput<T>,
  index: number
) => {
  let current: VRenderInput<T> | null = renderInput.siblings.children[0];
  let count = index;
  let length = current.length;

  while (current) {
    length = current.length;

    if (index > current.startIndex + length) {
      count = count - length;
    } else {
      break;
    }

    current = current.siblings.next;
  }

  if (count === length) {
    if (current?.siblings.next) {
      current = current.siblings.next;
      count = 0;
    }
  }

  return { vInput: current, index: count };
};
