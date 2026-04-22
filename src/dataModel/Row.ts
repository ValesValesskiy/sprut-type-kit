import { Eventable } from './Eventable';
import { Input, TInputEvents } from './Input';
import { Siblings } from './Siblings';
import { TextField } from './TextField';

export type TRowEvents = {
  ['row:add']: (newRow: Row) => void;
  ['row:change']: (row: Row) => void;
  ['row:remove']: (row: Row) => void;
};

export class Row extends Eventable<TRowEvents & TInputEvents> {
  siblings: Siblings<Row, TextField, Input> = new Siblings({ node: this });

  appendInputs(...inputs: Input[]) {
    this.siblings.appendChilds(...inputs);
  }

  getInputByPosition(positionNumber: number) {
    let nowIndex = positionNumber;
    const inputs = this.inputs;

    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].content.length > nowIndex) {
        return {
          input: inputs[i],
          position: nowIndex,
        };
      } else {
        nowIndex -= inputs[i].content.length;
      }
    }

    throw new Error(
      `Попытка получить индекс символа строки вне диапазона длины строки: { position: ${positionNumber} }`
    );
  }

  get inputs() {
    return this.siblings.children;
  }

  split(...n: number[]) {
    let rows: Row[] = [],
      rowInputs: Input[] = [],
      eachInputs = this.inputs,
      now = n[0],
      nowIndex = 0,
      inIndex = 0;

    while (nowIndex < n.length && n !== undefined) {
      let i = eachInputs[inIndex];

      if (i.content.length < now) {
        now -= i.content.length;
        inIndex++;
        rowInputs.push(i);
      } else {
        let split = i.split(now);

        rowInputs.push(split[0]);

        const newRow = new Row();

        newRow.appendInputs(...rowInputs);

        rows.push(newRow);
        rowInputs = [split[1]];
        eachInputs[inIndex] = split[1];
        now = n[++nowIndex];
      }
    }

    const newRow = new Row();

    newRow.appendInputs(...rowInputs, ...eachInputs.slice(inIndex + 1));

    rows.push(newRow);

    return rows;
  }

  splitInputs(...n: number[]) {
    let now = n[0],
      nowIndex = 0,
      inIndex = 0;

    const inputs = this.inputs;

    while (nowIndex < n.length && n !== undefined) {
      let i = inputs[inIndex];

      if (i.content.length < now) {
        now -= i.content.length;
        inIndex++;
      } else {
        let split = i.split(now),
          splittedInput = inputs[inIndex];

        split[0].siblings.insertBefore(splittedInput);
        split[1].siblings.insertBefore(splittedInput);

        splittedInput.destruct();

        inIndex += 1;
        now = n[++nowIndex];
      }
    }
  }

  paste(str: string, n: number) {
    let now = n,
      input: Input | null = null;

    const inputs = this.inputs;

    for (let i = 0; i < inputs.length; i++) {
      if (now < inputs[i].content.length) {
        input = inputs[i];
        break;
      } else {
        now -= inputs[i].content.length;
      }
    }

    if (input) {
      input.content =
        input.content.substr(0, now) + str + input.content.substr(now);
    }
  }

  delete(from: number, length: number) {
    let now = from,
      l = length;

    const inputs = this.inputs;

    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];

      if (now < input.content.length) {
        if (input.content.length - now < l) {
          l -= input.content.length - now;
          input.content = input.content.substr(0, now);
          now = 0;
          if (input.content.length === 0) {
            input.destruct();
          }
        } else {
          input.content =
            input.content.substr(0, now) + input.content.substr(now + l);
          break;
        }
      } else {
        now -= input.content.length;
      }
    }
  }

  // TODO
  /*spliceContent(from, length, str) {
		this.content = this.__content__.substr(0, from) + str + this.__content__.substr(from + length);
	}*/

  get content() {
    return this.inputs.map((i) => i.content).join('');
  }

  destruct() {
    for (let i of this.inputs) {
      i.destruct();
    }

    this.siblings.remove();
    this.emit('row:remove', this);
  }
}
