export type TSelectionPoint = {
  x: number;
  y: number;
  radius?: number | [number, number];
};

export function drawRoundLines(
  canvasRenderingContext2D: CanvasRenderingContext2D,
  p: Array<TSelectionPoint> = [],
  radius: number | [number, number] = 2
) {
  if (p.length > 2) {
    let dx = p[1].x - p[0].x,
      dy = p[1].y - p[0].y,
      l = Math.sqrt(dx * dx + dy * dy);

    const r = p[0].radius || radius;
    const r1 = r instanceof Array ? r[0] : r;
    const r2 = r instanceof Array ? r[1] : r;

    canvasRenderingContext2D.beginPath();
    canvasRenderingContext2D.moveTo(
      p[0].x + (dx / l) * r2,
      p[0].y + (dy / l) * r2
    );
    for (let pi = 1; pi < p.length; pi++) {
      const r = p[pi].radius || radius;
      const r1 = r instanceof Array ? r[0] : r;
      const r2 = r instanceof Array ? r[1] : r;

      if (pi !== p.length - 1) {
        canvasRenderingContext2D.lineTo(
          p[pi].x - (dx / l) * r1,
          p[pi].y - (dy / l) * r1
        );

        dx = p[pi + 1].x - p[pi].x;
        dy = p[pi + 1].y - p[pi].y;
        l = Math.sqrt(dx * dx + dy * dy);
        canvasRenderingContext2D.quadraticCurveTo(
          p[pi].x,
          p[pi].y,
          p[pi].x + (dx / l) * r2,
          p[pi].y + (dy / l) * r2
        );
      } else {
        canvasRenderingContext2D.lineTo(
          p[pi].x - (dx / l) * r1,
          p[pi].y - (dy / l) * r1
        );

        dx = p[0].x - p[pi].x;
        dy = p[0].y - p[pi].y;
        l = Math.sqrt(dx * dx + dy * dy);
        canvasRenderingContext2D.quadraticCurveTo(
          p[pi].x,
          p[pi].y,
          p[pi].x + (dx / l) * r2,
          p[pi].y + (dy / l) * r2
        );
      }
    }

    canvasRenderingContext2D.lineTo(
      p[0].x - (dx / l) * r1,
      p[0].y - (dy / l) * r1
    );

    dx = p[1].x - p[0].x;
    dy = p[1].y - p[0].y;
    l = Math.sqrt(dx * dx + dy * dy);
    canvasRenderingContext2D.quadraticCurveTo(
      p[0].x,
      p[0].y,
      p[0].x + (dx / l) * r2,
      p[0].y + (dy / l) * r2
    );
    canvasRenderingContext2D.closePath();
  }
}

// Попробовать потом эту

/*

export function roundPoint(
  ctx: CanvasRenderingContext2D,
  p: Array<{ x: number; y: number; radius?: number | [number, number] }> = [],
  radius: number | [number, number] = 2
) {
  const len = p.length;
  if (len < 2) return; // Для линии нужно хотя бы 2 точки

  // Маленький хелпер для радиуса, esbuild его отлично встроит (inline)
  const getR = (o: any) => {
    const r = o.radius ?? radius;
    return Array.isArray(r) ? r : [r, r];
  };

  ctx.beginPath();

  // Начальные параметры
  let [r1, r2] = getR(p[0]);
  let dx = p[1].x - p[0].x;
  let dy = p[1].y - p[0].y;
  let l = Math.sqrt(dx * dx + dy * dy) || 1;

  // Точка старта (отступ от p0 в сторону p1)
  ctx.moveTo(p[0].x + (dx / l) * r2, p[0].y + (dy / l) * r2);

  for (let i = 1; i < len; i++) {
    const curr = p[i];
    const next = p[i + 1] || p[0]; // Замыкаем на начало, если это последняя точка
    [r1, r2] = getR(curr);

    // Линия к текущей точке (не доходя r1)
    ctx.lineTo(curr.x - (dx / l) * r1, curr.y - (dy / l) * r1);

    // Расчет следующего плеча
    const nx = next.x - curr.x;
    const ny = next.y - curr.y;
    const nl = Math.sqrt(nx * nx + ny * ny) || 1;
    
    const [nr1, nr2] = getR(curr); // Радиус для выхода из угла

    // Рисуем скругление
    ctx.quadraticCurveTo(curr.x, curr.y, curr.x + (nx / nl) * nr2, curr.y + (ny / nl) * nr2);

    // Обновляем текущий вектор для следующей итерации
    dx = nx; dy = ny; l = nl;
  }

  ctx.closePath();
}

*/
