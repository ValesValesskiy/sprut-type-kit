import { Cursor } from './Cursor';
import { Input } from './Input';

type TSelectionOptions = {
  cursor: Cursor;
  startInput: Input;
  finishInput: Input;
  startIndex: number;
  finishIndex: number;
};

export class Selection {
  cursor: Cursor;
  startInput: Input;
  finishInput: Input;
  startIndex: number;
  finishIndex: number;

  constructor({
    cursor,
    finishIndex,
    finishInput,
    startIndex,
    startInput,
  }: TSelectionOptions) {
    this.cursor = cursor;
    this.startInput = startInput;
    this.finishInput = finishInput;
    this.startIndex = startIndex;
    this.finishIndex = finishIndex;
  }
}
