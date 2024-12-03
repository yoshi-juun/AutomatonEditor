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
  // 必要な状態が存在しない場合は何も描画しない
  if (!fromState || !toState) return null;

  const [isEditing, setIsEditing] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const store = useAutomatonStore();
  const { mode, selectedTransitionId, automaton, dispatch } = store;
  
  if (!automaton || !dispatch) {
    console.error('Store not properly initialized');
    return null;
  }

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
        <div className="relative flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary"
                className="h-6 min-w-[2rem] px-2 text-sm font-medium bg-background border border-border shadow-sm hover:bg-accent"
              >
                {transition.input}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-24">
              {Array.from(automaton.alphabet).map((input) => (
                <DropdownMenuItem
                  key={input}
                  onClick={() => {
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
                onSelect={() => {
                  setIsEditing(true);
                }}
                className="justify-center font-medium"
              >
                新規入力
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isEditing && (
            <div 
              className="fixed inset-0 flex items-center justify-center bg-background/80"
              onClick={(e) => e.stopPropagation()}
            >
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
        </div>
      </foreignObject>
    </g>
  );
}
