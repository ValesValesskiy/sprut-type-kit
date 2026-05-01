import { getVInputElement } from './getVInputElement';

import { RenderTextField } from '../RenderTextField';
import { VRenderInput } from '../VRenderInput';

export const getVRenderInputByClientCoords = (
  field: RenderTextField<HTMLElement>,
  { x, y }: { x: number; y: number }
) => {
  const caretPosition = document.caretPositionFromPoint(x, y);
  const vRenderInput: VRenderInput<HTMLElement> | null = getVInputElement(
    field,
    caretPosition?.offsetNode!
  );

  return { vRenderInput, caretPosition };
};
