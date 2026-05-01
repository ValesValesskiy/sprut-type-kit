export function drawRoundRect(
  canvasRenderingContext2D: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  r = 2
) {
  canvasRenderingContext2D.moveTo(x + r, y);
  canvasRenderingContext2D.lineTo(x + width - r, y);
  canvasRenderingContext2D.quadraticCurveTo(x + width, y, x + width, y + r);
  canvasRenderingContext2D.lineTo(x + width, y + height - r);
  canvasRenderingContext2D.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  );
  canvasRenderingContext2D.lineTo(x + r, y + height);
  canvasRenderingContext2D.quadraticCurveTo(x, y + height, x, y + height - r);
  canvasRenderingContext2D.lineTo(x, y + r);
  canvasRenderingContext2D.quadraticCurveTo(x, y, x + r, y);
}
