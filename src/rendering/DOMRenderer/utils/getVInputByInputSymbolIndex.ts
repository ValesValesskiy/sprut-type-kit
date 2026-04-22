import { RenderInput } from '../RenderInput';
import { VRenderInput } from '../VRenderInput';

export const getVInputByInputSymbolIndex = <T extends object>(
  renderInput: RenderInput<T>,
  index: number
) => {
  let current: VRenderInput<T> | null = renderInput.siblings.children[0];
  let count = index;

  while (current) {
    if (index > current.startIndex + current.length) {
      count = count - current.length;
    } else {
      break;
    }

    current = current.siblings.next;
  }

  return { vInput: current, index: count };
};
