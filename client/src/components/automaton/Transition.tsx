import { useState, useRef } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Transition as TransitionType, State } from '../../lib/automatonTypes';
import { calculateTransitionPath, calculateArrowHead, isPointNearPath } from '../../lib/automatonUtils';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
        x={midpoint.x - 20}
        y={midpoint.y - 12}
        width="40"
        height="24"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-full px-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              {transition.input}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-24">
            {[...automaton.alphabet].map((input) => (
              <DropdownMenuItem
                key={input}
                onSelect={() => {
                  dispatch({
                    type: 'UPDATE_TRANSITION',
                    payload: { ...transition, input }
                  });
                }}
              >
                {input}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onSelect={() => setIsEditing(true)}
              className="justify-center font-medium"
            >
              新規入力
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {isEditing && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80">
            <div className="bg-card p-4 rounded-lg shadow-lg">
              <Input
                type="text"
                value={transition.input}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                autoFocus
                className="w-24 text-center"
              />
            </div>
          </div>
        )}
      </foreignObject>
    </g>
  );
}
