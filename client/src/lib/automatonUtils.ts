import { Point, State, Transition } from './automatonTypes';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const calculateTransitionPath = (
  from: State,
  to: State,
  controlPoint?: Point
): string => {
  if (!from || !to) return '';

  if (from.id === to.id) {
    // セルフループの描画をさらに大きく、横方向により広く
    const r = 25; // 状態の半径
    const loopRX = 60; // 横方向のループ半径
    const loopRY = 45; // 縦方向のループ半径
    const offset = 80; // 上方向へのオフセット
    
    return `M ${from.position.x} ${from.position.y - r}
            C ${from.position.x - loopRX} ${from.position.y - offset},
              ${from.position.x + loopRX} ${from.position.y - offset},
              ${from.position.x} ${from.position.y - r}`;
  }

  // 既存の通常の遷移線の描画コード
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const radius = 25;
  const ratio = radius / distance;
  const startX = from.position.x + dx * ratio;
  const startY = from.position.y + dy * ratio;
  const endX = to.position.x - dx * ratio;
  const endY = to.position.y - dy * ratio;

  if (controlPoint) {
    return `M ${startX} ${startY} 
            Q ${controlPoint.x} ${controlPoint.y} ${endX} ${endY}`;
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -dy / distance * 50;
  const perpY = dx / distance * 50;
  const ctrlX = midX + perpX;
  const ctrlY = midY + perpY;

  return `M ${startX} ${startY} 
          Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
};

export const calculateArrowHead = (
  from: Point,
  to: Point,
  controlPoint?: Point
): string => {
  const arrowLength = 10;
  const arrowWidth = 6;
  
  let endX = to.x;
  let endY = to.y;
  let dx, dy;
  
  if (controlPoint) {
    // For curved paths, calculate tangent at endpoint
    const t = 0.99; // Get point very close to end
    const x1 = from.x;
    const y1 = from.y;
    const x2 = controlPoint.x;
    const y2 = controlPoint.y;
    const x3 = to.x;
    const y3 = to.y;
    
    const prevX = (1-t)*(1-t)*x1 + 2*(1-t)*t*x2 + t*t*x3;
    const prevY = (1-t)*(1-t)*y1 + 2*(1-t)*t*y2 + t*t*y3;
    
    dx = to.x - prevX;
    dy = to.y - prevY;
  } else {
    dx = to.x - from.x;
    dy = to.y - from.y;
  }
  
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return '';
  
  const x1 = endX - arrowLength * Math.cos(angle - Math.PI/6);
  const y1 = endY - arrowLength * Math.sin(angle - Math.PI/6);
  const x2 = endX - arrowLength * Math.cos(angle + Math.PI/6);
  const y2 = endY - arrowLength * Math.sin(angle + Math.PI/6);
  
  return `M ${endX} ${endY} L ${x1} ${y1} M ${endX} ${endY} L ${x2} ${y2}`;
};

export const isPointNearPath = (
  point: Point,
  path: SVGPathElement,
  threshold = 5
): boolean => {
  const pathLength = path.getTotalLength();
  let bestDistance = Infinity;
  
  for (let i = 0; i <= pathLength; i += 5) {
    const p = path.getPointAtLength(i);
    const distance = Math.sqrt(
      Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2)
    );
    if (distance < bestDistance) {
      bestDistance = distance;
    }
  }
  
  return bestDistance <= threshold;
};
