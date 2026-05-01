import { Cursor } from './Cursor';
import { Input } from './Input';

import { getSortedForSelection } from '../rendering/DOMRenderer/utils';

export type TTextSelectionOptions = {
  startInput: Input;
  finishInput?: Input;
  startIndex: number;
  finishIndex?: number;
};

interface ReadyToSelection {
  startInput: Input;
  finishInput: Input;
  startIndex: number;
  finishIndex: number;
}

export class TextSelection {
  startInput: Input;
  startIndex: number;
  finishInput: Input | null;
  finishIndex: number | null;

  getHasSelection(): this is this & ReadyToSelection {
    return (
      this.finishInput !== null &&
      this.finishIndex !== null &&
      (this.startInput === this.finishInput
        ? this.finishIndex - this.startIndex !== 0
        : true)
    );
  }

  constructor({
    startInput,
    finishInput,
    startIndex,
    finishIndex,
  }: TTextSelectionOptions) {
    this.startInput = startInput;
    this.finishInput = finishInput || null;
    this.startIndex = startIndex;
    this.finishIndex = finishIndex || null;
  }

  get length() {
    const { first, firstIndex, last, lastIndex } = getSortedForSelection(this);

    if (first === last) {
      return lastIndex - firstIndex;
    }

    let result = first.content.length - firstIndex;
    let current = first.nextInput;

    while (current && current !== last) {
      result += current.content.length;

      current = current.nextInput;
    }

    result += lastIndex;

    return result;
  }

  reset(startInput: Input, startIndex: number) {
    this.startInput = startInput;
    this.startIndex = startIndex;

    this.finishInput = null;
    this.finishIndex = null;
  }
}
