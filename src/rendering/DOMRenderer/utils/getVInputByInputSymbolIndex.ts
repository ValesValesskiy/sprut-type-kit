import { RenderInput } from '../RenderInput';
import { VRenderInput } from '../VRenderInput';

export const getVInputByInputSymbolIndex = <T extends object>(
  renderInput: RenderInput<T>,
  index: number,
  withoutRenders: boolean = true
) => {
  let current: VRenderInput<T> | null = renderInput.siblings.children[0];
  let count = index;
  let length = current.length;

  while (current) {
    length = current.length;

    if (
      index >
      current.startIndex +
        length -
        (withoutRenders && current.renderViewNode ? 0 : 0)
    ) {
      count = count - length;
    } else {
      break;
    }

    current = current.siblings.next;
  }

  if (count === length) {
    if (
      current?.siblings.next &&
      (withoutRenders ? !current?.siblings.next.renderViewNode : true)
    ) {
      current = current.siblings.next;
      count = 0;
    }
  }

  return { vInput: current, index: count };
};
