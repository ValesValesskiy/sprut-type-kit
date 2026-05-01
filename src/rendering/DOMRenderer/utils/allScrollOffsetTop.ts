export function allScrollOffsetTop(el: HTMLElement | null) {
  let parent: HTMLElement | null = el;
  let offset = 0;

  while (parent) {
    offset += parent.scrollTop || 0;
    parent = parent.parentElement;
  }

  return offset;
}
