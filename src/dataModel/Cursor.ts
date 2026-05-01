import { Eventable } from './Eventable';
import { Input } from './Input';
import { TextField } from './TextField';
import { TextSelection } from './TextSelection';

export class Cursor extends Eventable<{ mounted: () => void }> {
  meta: {
    isOwn?: boolean;
  } = {};

  private _input!: Input;
  positionInInput: number;
  field: TextField;

  selection: TextSelection;

  get input() {
    return this._input;
  }
  set input(v) {
    if (!v) {
      console.log('cursor:', v);
      throw new Error('Input is null');
    }
    this._input = v;
  }

  constructor({
    positionInInput,
    input,
    field,
  }: {
    positionInInput: number;
    input: Input;
    field: TextField;
  }) {
    super();
    this.input = input;
    this.positionInInput = positionInInput;
    this.field = field;

    this.on('mounted', () => {
      input.emit('cursor:focus', this);

      this.field.emit(
        'cursor:translate',
        this,
        { input, positionInInput },
        { input, positionInInput }
      );
    });

    this.selection = new TextSelection({
      startInput: this.input,
      startIndex: this.positionInInput,
    });
  }

  translate(input: Input, positionInInput: number, force?: boolean) {
    const prevInput = this.input;
    const prevPosition = this.positionInInput;

    let targetInput: Input;
    let targetPosition: number;

    // TODO: данну стратегию лучше вынести в рендер, в данных оставить возможность гибко перемещать курсор
    // Это влияет на то, как курсор ведёт себя на границах форматированного инпута
    // Далее можно оставить возможность при удалении нулевого пустого символа например сращивать инпуты в один стиль предыдущего
    // или сразу удалять символ предыдущего, а данный сохранять как есть
    // При удалении в ноль инпута можно сразу удалять его, а можно оставлять для сохранения настроек стиля, чтобы писать прямо в пустом инпуте
    // со старыми стилями, либо же сразу удалять его и переходить к предыдущему
    // возможно это стоит выненсти в настройки или оставить на заботу рендера
    if (false && positionInInput === 0 && input.siblings.previous) {
      targetInput = input.siblings.previous;
      targetPosition = targetInput.content.length;
    } else {
      targetInput = input;
      targetPosition = positionInInput;
    }

    this.input = targetInput;
    this.positionInInput = targetPosition;

    if (force || targetInput !== prevInput) {
      prevInput.emit('cursor:blur', this);
      targetInput.emit('cursor:focus', this);
    }

    if (force || prevInput !== targetInput || prevPosition !== targetPosition) {
      this.field.emit(
        'cursor:translate',
        this,
        { input: targetInput, positionInInput: targetPosition },
        { input: prevInput, positionInInput: prevPosition }
      );
    }
  }

  updatePosition() {
    this.translate(this.input, this.positionInInput, true);
  }

  get selectedNodesData(): {
    startIndex: number;
    finishIndex: number;
    nodes: Array<Input>;
  } | null {
    if (this.selection) {
      const selection = this.selection;

      return {
        startIndex: 0,
        finishIndex: 0,
        nodes: this.field.siblings.select(() => true, {
          from: selection.startInput,
          to: selection.finishInput || selection.startInput,
          maxLevel: 2,
          minLevel: 2,
        }) as unknown as Array<Input>,
      };
    }

    return null;
  }

  relativeTranslate(offset: number, withInputTransitions: boolean = false) {
    if (offset > 0) {
      if (this.input.content.length - this.positionInInput < offset) {
        const newOffset =
          offset -
          (this.input.content === ''
            ? 0
            : this.input.content.length - this.positionInInput);

        if (this.input.siblings.next) {
          this.input = this.input.siblings.next;
          this.positionInInput = 0;

          this.relativeTranslate(
            newOffset - (withInputTransitions ? 1 : 0),
            withInputTransitions
          );

          return;
        } else {
          const nextRow = this.input.siblings.parent?.siblings.next;

          if (nextRow) {
            if (nextRow.siblings.firstChild) {
              this.input = nextRow.siblings.firstChild;
              this.positionInInput = 0;

              this.relativeTranslate(newOffset - 1, withInputTransitions);

              return;
            }
          }
        }

        this.translate(this.input, this.input.content.length);

        return;
      } else {
        this.translate(this.input, this.positionInInput + offset);

        return;
      }
    } else if (offset < 0) {
      if (this.positionInInput + offset <= 0) {
        const newOffset =
          offset + (this.input.content === '' ? 0 : this.positionInInput);

        if (newOffset === 0) {
          this.translate(this.input, 0);

          return;
        }

        if (this.input.siblings.previous) {
          this.input = this.input.siblings.previous;
          this.positionInInput = this.input.content.length;

          this.relativeTranslate(
            newOffset + (withInputTransitions ? 1 : 0),
            withInputTransitions
          );

          return;
        } else {
          const prevRow = this.input.siblings.parent?.siblings.previous;

          if (prevRow) {
            if (prevRow.siblings.lastChild) {
              this.input = prevRow.siblings.lastChild;
              this.positionInInput = this.input.content.length;

              this.relativeTranslate(newOffset + 1, withInputTransitions);

              return;
            }
          }
        }

        this.translate(this.input, 0);

        return;
      } else {
        this.translate(this.input, this.positionInInput + offset);

        return;
      }
    } else {
      console.log('!!!!!!!');
      this.translate(this.input, this.positionInInput, true);
    }
  }

  destruct() {
    this.field.emit('cursor:remove', this);
  }
}
