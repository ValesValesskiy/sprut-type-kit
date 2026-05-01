export function allScrollOffsetLeft(el: HTMLElement | null) {
  let parent: HTMLElement | null = el;
  let offset = 0;

  while (parent) {
    offset += parent.scrollLeft || 0;
    parent = parent.parentElement;
  }

  return offset;
}
