import { RenderTextField } from './RenderTextField';
import { getVInputByInputSymbolIndex } from './utils';

import { Cursor } from '../../dataModel';

export class RenderCursor<T extends object> {
  dataNode!: Cursor;
  element?: T;

  renderField!: RenderTextField<T>;

  getVInputByCursorPosition() {
    const renderInput = this.renderField?.dataInputToRenderMap.get(
      this.dataNode.input
    );

    if (!renderInput) {
      throw new Error('');
    }

    return getVInputByInputSymbolIndex(
      renderInput,
      this.dataNode.positionInInput
    );
  }
}
