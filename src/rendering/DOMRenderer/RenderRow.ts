import { RenderInput } from './RenderInput';
import { RenderTextField } from './RenderTextField';

import { Row, Siblings, TreeNode } from '../../dataModel';

export class RenderRow<T extends object> {
  dataNode?: Row;
  element?: T;
  siblings: Siblings<RenderRow<T>, RenderTextField<T>, RenderInput<T>> =
    new Siblings({
      node: this,
    });
}
