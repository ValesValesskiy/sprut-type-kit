import { RenderTextField } from '../RenderTextField';
import { VRenderInput } from '../VRenderInput';

export function getVInputElement(
  field: RenderTextField<HTMLElement>,
  node: Node
): VRenderInput<HTMLElement> | null {
  let current = node.parentElement;

  while (current) {
    const tryVInput = field.vInputViewToRenderMap.get(current);

    if (tryVInput) {
      return tryVInput;
    }

    current = current.parentElement;
  }

  return null;
}
