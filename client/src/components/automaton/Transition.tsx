import { useState, useRef } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Transition as TransitionType, State, Point } from '../../lib/automatonTypes';
import { calculateTransitionPath, calculateArrowHead, isPointNearPath } from '../../lib/automatonUtils';
import { Input } from '@/components/ui/input';

interface TransitionProps {
  transition: TransitionType;
  fromState: State;
  toState: State;
}

export function Transition({ transition, fromState, toState }: TransitionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const { selectedTransitionId, dispatch } = useAutomatonStore();

  const path = calculateTransitionPath(fromState, toState, transition.controlPoint);
  const arrowPath = calculateArrowHead(
    fromState.position,
    toState.position,
    transition.controlPoint
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pathRef.current && isPointNearPath({ x: e.clientX, y: e.clientY }, pathRef.current)) {
      dispatch({ type: 'SELECT_TRANSITION', payload: transition.id });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
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

  // Calculate label position
  const midpoint = pathRef.current?.getPointAtLength(
    (pathRef.current?.getTotalLength() || 0) / 2
  ) || { x: 0, y: 0 };

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
        onDoubleClick={handleDoubleClick}
      />

      {/* Transition label */}
      <foreignObject
        x={midpoint.x - 15}
        y={midpoint.y - 12}
        width="30"
        height="24"
      >
        {isEditing ? (
          <Input
            type="text"
            value={transition.input}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            autoFocus
            className="w-full h-full text-center bg-transparent border-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-medium">
            {transition.input}
          </div>
        )}
      </foreignObject>
    </g>
  );
}
