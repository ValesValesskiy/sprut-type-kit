import { Cursor } from './Cursor';
import { Eventable } from './Eventable';
import { InputStyle, StyleFieldChange, TInputStyleEvents } from './InputStyle';
import { Row } from './Row';
import { Siblings } from './Siblings';
import { TextField } from './TextField';

export type TInputEvents = {
  ['input:add']: (newInput: Input) => void;
  ['input:change']: (input: Input) => void;
  ['input:remove']: (input: Input) => void;
  ['input:mutation:insert']: (
    input: Input,
    eventData: { data: string; position: number }
  ) => void;
  ['cursor:focus']: (cursor: Cursor) => void;
  ['cursor:blur']: (cursor: Cursor) => void;
  ['input:style:changed']: (
    props: Array<StyleFieldChange>,
    input: Input
  ) => void;
};

export class Input extends Eventable<TInputEvents> {
  private _content: string = '';

  constructor(content: string) {
    super();
    this.content = content || '';
    this.style = new InputStyle({
      color: '#000',
      fontSize: '12px',
      weight: 400,
      letterSpacing: 0,
      lineHeight: '1',
      decoration: 'none',
    });

    this.pipeEvent<TInputStyleEvents, TInputEvents>(
      this.style,
      'input:style:changed',
      'input:style:changed',
      (props) => [props, this]
    );
    this.siblings.pipeEvent(
      this.style,
      'input:style:changed',
      'input:style:changed',
      (props) => [props, this]
    );
  }

  siblings: Siblings<Input, Row, any> = new Siblings({ node: this });

  style: InputStyle;

  get content() {
    return this._content;
  }

  set content(content: string) {
    this._content = content;
    this.siblings.emit('input:change', this);
  }

  get nextInput(): Input | null {
    if (this.siblings.next) {
      return this.siblings.next;
    } else if (this.siblings.parent?.siblings.next) {
      return this.siblings.parent?.siblings.next.siblings.firstChild;
    }

    return null;
  }

  get previousInput(): Input | null {
    if (this.siblings.previous) {
      return this.siblings.previous;
    } else if (this.siblings.parent?.siblings.previous) {
      return this.siblings.parent?.siblings.previous.siblings.lastChild;
    }

    return null;
  }

  insertText({ data, position }: { data: string; position: number }) {
    this._content =
      this._content.substring(0, position) +
      data +
      this._content.substring(position);

    this.siblings.emit('input:mutation:insert', this, { data, position });
  }

  split(...n: number[]) {
    let prev = 0,
      res = [];

    for (let a = 0; a <= n.length; a++) {
      res.push(new Input(this._content.substring(prev, n[a])));
      prev = n[a] || 0;
    }

    return res;
  }

  paste(str: string, n: number) {
    this.content = this._content.substr(0, n) + str + this._content.substr(n);
  }

  delete(from: number, length: number) {
    this.content =
      this._content.substr(0, from) +
      this._content.substr(from + (length || this._content.length));
  }

  spliceContent(from: number, length: number, str: string) {
    this.content =
      this._content.substr(0, from) + str + this._content.substr(from + length);
  }

  iterateFromThis(
    {
      arrow,
      index,
    }: Pick<
      Exclude<Parameters<TextField['iterateContent']>[1], undefined>,
      'arrow'
    > & { index: number },
    iterationHandler: Parameters<TextField['iterateContent']>[0]
  ) {
    this.siblings.parent?.siblings.parent?.iterateContent(iterationHandler, {
      from: { index, input: this, row: this.siblings.parent },
      arrow,
    });
  }

  getIntoRowIndex(index: number) {
    let current = this.siblings.previous;
    let count = index;

    while (current) {
      count += current.content.length;
      current = current.siblings.previous;
    }

    return count;
  }

  destruct() {
    this.siblings.remove();
    this.emit('input:remove', this);
  }
}
