import { RenderCursor } from './RenderCursor';
import { RenderInput } from './RenderInput';
import { RenderRow } from './RenderRow';
import { VRenderInput } from './VRenderInput';

import {
  Cursor,
  Eventable,
  Input,
  Row,
  Siblings,
  TextField,
  TreeNode,
} from '../../dataModel';

export class RenderTextField<T extends object> extends Eventable<{
  'v-input:add': (vInput: VRenderInput<T>) => void;
  'v-input:remove': (input: VRenderInput<T>) => void;
  'input:add': (input: RenderInput<T>) => void;
  'input:change': (input: RenderInput<T>) => void;
  ['input:mutation:insert']: (
    input: RenderInput<T>,
    eventData: { data: string; position: number }
  ) => void;
  'input:remove': (input: RenderInput<T>) => void;
  'row:add': (row: RenderRow<T>) => void;
  'row:remove': (row: RenderRow<T>) => void;
  'cursor:add': (cursor: RenderCursor<T>) => void;
  ['cursor:translate']: (
    renderCursor: RenderCursor<T>,
    current: { renderInput: RenderInput<T>; positionInInput: number },
    prev: { renderInput: RenderInput<T>; positionInInput: number }
  ) => void;
  'cursor:remove': (cursor: RenderCursor<T>) => void;
  'input:style:changed': (input: Input) => void;
}> {
  private _dataRowToRenderMap = new WeakMap<Row, RenderRow<T>>();
  private _dataInputToRenderMap = new WeakMap<Input, RenderInput<T>>();

  private _rowViewToRenderMap = new WeakMap<T, RenderRow<T>>();

  private _inputViewToRenderMap = new WeakMap<T, RenderInput<T>>();
  private _vInputViewToRenderMap = new WeakMap<T, VRenderInput<T>>();

  private _dataCursorToRenderMap = new Map<Cursor, RenderCursor<T>>();

  get dataRowToRenderMap() {
    return this._dataRowToRenderMap;
  }

  get dataInputToRenderMap() {
    return this._dataInputToRenderMap;
  }

  get inputViewToRenderMap() {
    return this._inputViewToRenderMap;
  }

  get vInputViewToRenderMap() {
    return this._vInputViewToRenderMap;
  }

  get rowViewToRenderMap() {
    return this._rowViewToRenderMap;
  }

  get dataCursorToRenderMap() {
    return this._dataCursorToRenderMap;
  }

  constructor() {
    super();

    const dataField = (this.dataNode = new TextField());

    this.siblings.on('mounted', (...childs) => {
      for (let child of childs) {
        switch (true) {
          case child instanceof VRenderInput: {
            this.emit('v-input:add', child);
            break;
          }
        }
      }
    });
    this.siblings.on('unmounted', (child) => {
      switch (true) {
        case child instanceof VRenderInput: {
          this.emit('v-input:remove', child);
          break;
        }
      }
    });

    dataField.siblings.on('mounted', (...childs) => {
      for (let child of childs) {
        switch (true) {
          case child instanceof Input: {
            const input = child;
            const newRenderInput = new RenderInput<T>();

            newRenderInput.dataNode = input;

            const nextDataNode = input.siblings.next;
            const nextRenderNode = nextDataNode
              ? this.dataInputToRenderMap.get(nextDataNode)
              : null;

            if (nextRenderNode) {
              newRenderInput.siblings.insertBefore(nextRenderNode);
            } else {
              this.dataRowToRenderMap
                .get(input.siblings.parent!)!
                .siblings.appendChild(newRenderInput);
            }

            this.dataInputToRenderMap.set(input, newRenderInput);
            this.emit('input:add', newRenderInput);
            break;
          }
          case child instanceof Row: {
            const row = child;

            const newRenderRow = new RenderRow<T>();

            newRenderRow.dataNode = row;

            const nextDataNode = row.siblings.next;
            const nextRenderNode = nextDataNode
              ? this.dataRowToRenderMap.get(nextDataNode)
              : null;

            if (nextRenderNode) {
              newRenderRow.siblings.insertBefore(nextRenderNode);
            } else {
              this.siblings.appendChild(newRenderRow);
            }

            this.dataRowToRenderMap.set(row, newRenderRow);
            this.emit('row:add', newRenderRow);
            break;
          }
        }
      }
    });
    dataField.siblings.on('unmounted', (child) => {
      switch (true) {
        case child instanceof Input: {
          const renderInput = this._dataInputToRenderMap.get(child)!;

          renderInput.siblings.remove();

          this.emit('input:remove', renderInput);
          break;
        }
        case child instanceof Row: {
          const renderRow = this._dataRowToRenderMap.get(child)!;

          renderRow.siblings.remove();

          this.emit('row:remove', renderRow);
          break;
        }
      }
    });

    this.dataNode.siblings.on('input:mutation:insert', (input, data) => {
      this.emit(
        'input:mutation:insert',
        this.dataInputToRenderMap.get(input)!,
        data
      );
    });

    this.pipeEvent(
      dataField.siblings,
      'input:style:changed',
      'input:style:changed'
    );

    dataField.on('cursor:add', (cursor) => {
      const renderCursor = new RenderCursor<T>();

      renderCursor.dataNode = cursor;
      renderCursor.renderField = this;

      this._dataCursorToRenderMap.set(cursor, renderCursor);
      this.emit('cursor:add', renderCursor);
    });
    dataField.on('cursor:translate', (cursor, current, prev) => {
      this.emit(
        'cursor:translate',
        this.dataCursorToRenderMap.get(cursor)!,
        {
          ...current,
          renderInput: this._dataInputToRenderMap.get(current.input)!,
        },
        { ...prev, renderInput: this._dataInputToRenderMap.get(prev.input)! }
      );
    });
    dataField.on('cursor:remove', (cursor) => {
      const renderCursor = this.dataCursorToRenderMap.get(cursor)!;

      this.dataCursorToRenderMap.delete(cursor);
      this.emit('cursor:remove', renderCursor);
    });
    dataField.siblings.on('input:change', (input) => {
      this.emit('input:change', this.dataInputToRenderMap.get(input)!);
    });
  }

  dataNode: TextField;
  element?: T;
  rowsElement?: HTMLElement;
  cursorsElement?: HTMLElement;
  siblings: Siblings<RenderTextField<T>, any, RenderRow<T>> = new Siblings({
    node: this,
  });

  get cursors() {
    return [...this._dataCursorToRenderMap.values()];
  }

  appendRow(row: Row) {
    this.dataNode.appendRow(row);
  }
}
