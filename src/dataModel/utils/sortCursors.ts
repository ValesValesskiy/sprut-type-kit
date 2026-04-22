import { Cursor } from '../Cursor';

export const sortCursors = (cursors: Array<Cursor>) => {
  return [...cursors].sort((a, b) => {
    let aIndex = 0;
    let bIndex = 0;

    if (a.input === b.input) {
      aIndex = a.positionInInput;
      bIndex = b.positionInInput;
    } else if (a.input.siblings.parent === b.input.siblings.parent) {
      aIndex = a.input.siblings.indexOf();
      bIndex = b.input.siblings.indexOf();
    } else {
      aIndex = a.input.siblings.parent!.siblings.indexOf();
      bIndex = b.input.siblings.parent!.siblings.indexOf();
    }

    return aIndex > bIndex ? 1 : aIndex < bIndex ? -1 : 0;
  });
};
