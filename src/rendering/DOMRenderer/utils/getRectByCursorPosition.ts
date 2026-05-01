export function getVInputRectByCursorPosition(
  node: Node,
  position: number,
  node_2?: Node,
  position_2?: number
) {
  const range = document.createRange();

  range.setStart(node, position);

  if (node_2 && position_2 != undefined) {
    range.setEnd(node_2, position_2);
  } else {
    range.setEnd(node, position);
  }

  return range.getClientRects();
}
