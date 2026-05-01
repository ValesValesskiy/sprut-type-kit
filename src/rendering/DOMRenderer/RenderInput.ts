import { RenderRow } from './RenderRow';
import { VRenderInput } from './VRenderInput';

import { Input, Siblings } from '../../dataModel';

export class RenderInput<T extends object> {
  dataNode?: Input;
  element?: T;
  siblings: Siblings<RenderInput<T>, RenderRow<T>, VRenderInput<T>> =
    new Siblings({ node: this });

  get nextInput(): RenderInput<T> | null {
    if (this.siblings.next) {
      return this.siblings.next;
    } else if (this.siblings.parent?.siblings.next) {
      return this.siblings.parent?.siblings.next.siblings.firstChild;
    }

    return null;
  }

  get previousInput(): RenderInput<T> | null {
    if (this.siblings.previous) {
      return this.siblings.previous;
    } else if (this.siblings.parent?.siblings.previous) {
      return this.siblings.parent?.siblings.previous.siblings.lastChild;
    }

    return null;
  }
}
