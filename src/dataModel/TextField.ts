import { Cursor } from './Cursor';
import { Eventable } from './Eventable';
import { Input, TInputEvents } from './Input';
import { Row, TRowEvents } from './Row';
import { Siblings } from './Siblings';

export type TFieldEvents = {
  ['field:add']: (newField: TextField) => void;
  ['field:change']: (field: TextField) => void;
  ['field:remove']: (field: TextField) => void;
  ['cursor:add']: (cursor: Cursor) => void;
  ['cursor:translate']: (
    cursor: Cursor,
    current: { input: Input; positionInInput: number },
    prev: { input: Input; positionInInput: number }
  ) => void;
  ['cursor:remove']: (cursor: Cursor) => void;
};

export class TextField extends Eventable<
  TFieldEvents & TRowEvents & TInputEvents
> {
  private _cursors: Cursor[] = [];

  constructor() {
    super();
    this.siblings.on('mounted', (node) => {});
    this.on('cursor:remove', function (cursor) {
      let i = this._cursors.indexOf(cursor);

      this._cursors.splice(i, 1);
    });
  }

  siblings: Siblings<TextField, any, Row> = new Siblings({ node: this });

  get rows() {
    return this.siblings.children;
  }

  get cursors() {
    return [...this._cursors];
  }

  addCursor(cursor: Cursor) {
    this._cursors.push(cursor);
    this.emit('cursor:add', cursor);
    cursor.emit('mounted');
  }

  appendRow(row: Row) {
    this.siblings.appendChild(row);
  }

  iterateContent(
    iteraionHandler: (
      a: {
        symbol: string;
        symbolIndex: number;
        iterationIndex: number;
        row: Row;
        input: Input;
        rowIndex: number;
        inputIndex: number;
      },
      c: { end: () => {} }
    ) => void,
    settings?: {
      from: { row: Row; input: Input; index: number };
      arrow?: 1 | -1;
    }
  ) {
    let iterationIndex = 0;
    let isContinue = true;
    const end = () => (isContinue = false);

    let _rowI = settings?.from.row.siblings.indexOf() || 0;
    let _inputI = settings?.from.input.siblings.indexOf() || 0;
    let _symbolI = settings?.from.index || 0;

    const arrow = settings?.arrow || 1;

    const rows = this.siblings.children;

    for (
      let rowIndex = _rowI;
      rowIndex < rows.length && rowIndex >= 0;
      rowIndex += arrow
    ) {
      const row = rows[rowIndex];
      const inputs = row.siblings.children;

      if (rowIndex !== _rowI) {
        _inputI = arrow === 1 ? 0 : inputs.length - 1;
      }
      for (
        let inputIndex = _inputI;
        inputIndex < inputs.length && inputIndex >= 0;
        inputIndex += arrow
      ) {
        const input = inputs[inputIndex];
        const symbols = input.content;

        if (inputIndex !== _inputI) {
          _symbolI = arrow === 1 ? 0 : symbols.length - 1;
        }

        for (
          let symbolIndex = _symbolI;
          symbolIndex < symbols.length && symbolIndex >= 0;
          symbolIndex += arrow
        ) {
          iteraionHandler(
            {
              iterationIndex,
              symbol: symbols[symbolIndex],
              symbolIndex,
              row,
              input,
              rowIndex,
              inputIndex,
            },
            { end }
          );

          if (!isContinue) {
            return;
          }

          iterationIndex++;
        }
      }
    }
  }
}
