import { Eventable } from './Eventable';

export type StyleFields = {
  fontSize: string;
  weight: number;
  color: string;
  letterSpacing: number | string;
  lineHeight: string;
  decoration: string;
};

export type StyleFieldChange = {
  [K in keyof StyleFields]: {
    name: K;
    value: StyleFields[K];
    prev: StyleFields[K];
  };
}[keyof StyleFields];

export type TInputStyleEvents = {
  ['input:style:changed']: (props: Array<StyleFieldChange>) => void;
};

export class InputStyle extends Eventable<TInputStyleEvents> {
  private style: StyleFields;

  constructor(defaultStyle: StyleFields) {
    super();
    this.style = defaultStyle;
  }

  get fontSize() {
    return this.style.fontSize;
  }
  set fontSize(value) {
    const newValue = typeof value === 'number' ? value + 'px' : value;
    const prev = this.style.fontSize;

    this.style.fontSize = newValue;

    this.emit('input:style:changed', [
      { name: 'fontSize', value: newValue, prev },
    ]);
  }

  get weight() {
    return this.style.weight;
  }
  set weight(value: number) {
    const prev = this.style.weight;

    this.style.weight = value;

    this.emit('input:style:changed', [{ name: 'weight', value, prev }]);
  }

  get color() {
    return this.style.color;
  }
  set color(value: string | number[]) {
    const prev = this.style.color;
    const color =
      value instanceof Array
        ? `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[4] !== undefined ? value[4] : 1})`
        : value;

    this.style.color = color;

    this.emit('input:style:changed', [{ name: 'color', value: color, prev }]);
  }

  get letterSpacing() {
    return this.style.letterSpacing;
  }
  set letterSpacing(value: number | string) {
    const newValue = typeof value === 'number' ? value + 'px' : value;
    const prev = this.style.letterSpacing;

    this.style.letterSpacing = newValue;

    this.emit('input:style:changed', [
      { name: 'letterSpacing', value: newValue, prev },
    ]);
  }

  get lineHeight() {
    return this.style.lineHeight;
  }
  set lineHeight(value) {
    const prev = this.style.lineHeight;

    this.style.lineHeight = value;

    this.emit('input:style:changed', [{ name: 'lineHeight', value, prev }]);
  }

  get decoration() {
    return this.style.decoration;
  }
  set decoration(value) {
    const prev = this.style.decoration;

    this.style.decoration = value;

    this.emit('input:style:changed', [{ name: 'decoration', value, prev }]);
  }
}
