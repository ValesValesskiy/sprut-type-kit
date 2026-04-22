import { RenderRow } from './RenderRow';
import { VRenderInput } from './VRenderInput';

import { Input, Siblings } from '../../dataModel';

export class RenderInput<T extends object> {
  dataNode?: Input;
  element?: T;
  siblings: Siblings<RenderInput<T>, RenderRow<T>, VRenderInput<T>> =
    new Siblings({ node: this });
}
