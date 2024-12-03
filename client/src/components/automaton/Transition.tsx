import { useState, useRef } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Transition as TransitionType, State } from '../../lib/automatonTypes';
import { calculateTransitionPath, calculateArrowHead, isPointNearPath } from '../../lib/automatonUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TransitionProps {
  transition: TransitionType;
  fromState: State;
  toState: State;
}

export function Transition({ transition, fromState, toState }: TransitionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const { mode, selectedTransitionId, dispatch } = useAutomatonStore();

  const path = calculateTransitionPath(fromState, toState, transition.controlPoint);
  const arrowPath = calculateArrowHead(
    fromState.position,
    toState.position,
    transition.controlPoint
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'delete') {
      dispatch({ type: 'DELETE_TRANSITION', payload: transition.id });
      return;
    }

    if (pathRef.current && isPointNearPath({ x: e.clientX, y: e.clientY }, pathRef.current)) {
      dispatch({ type: 'SELECT_TRANSITION', payload: transition.id });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_TRANSITION',
      payload: { ...transition, input: e.target.value }
    });
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  // Calculate label position with offset
  const midpoint = (() => {
    if (!pathRef.current) return { x: 0, y: 0 };
    
    const pathLength = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(pathLength / 2);
    
    // 表示位置を線の中央上部に調整
    const offset = 20;  // 上方向へのオフセット
    return {
      x: point.x,
      y: point.y - offset
    };
  })();

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        className={`
          fill-none
          stroke-primary
          stroke-2
          transition-colors
          ${selectedTransitionId === transition.id ? 'stroke-[3]' : ''}
        `}
        markerEnd="url(#arrowhead)"
        onClick={handleClick}
        onDoubleClick={() => setIsEditing(true)}
      />

      {isEditing ? (
        <foreignObject
          x={midpoint.x - 20}
          y={midpoint.y - 12}
          width="40"
          height="24"
        >
          <Input
            type="text"
            value={transition.input}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            autoFocus
            className="w-24 text-center"
          />
        </foreignObject>
      ) : (
        <foreignObject
          x={midpoint.x - 20}
          y={midpoint.y - 12}
          width="40"
          height="24"
        >
          <Button 
            variant="secondary"
            className="h-6 min-w-[2rem] px-2 text-sm font-medium bg-background border border-border shadow-sm hover:bg-accent"
            onClick={() => setIsEditing(true)}
          >
            {transition.input}
          </Button>
        </foreignObject>
      )}
    </g>
  );
}