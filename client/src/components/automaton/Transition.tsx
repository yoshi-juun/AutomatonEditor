import { useState, useRef, useEffect } from 'react';
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
  const { mode, selectedTransitionId, automaton, dispatch } = useAutomatonStore();
  
  // 必要な状態が存在しない場合は何も描画しない
  if (!fromState || !toState || !automaton || !dispatch) {
    console.error('Required props or store not properly initialized');
    return null;
  }

  const path = calculateTransitionPath(fromState, toState, transition.controlPoint);
  const arrowPath = calculateArrowHead(
    fromState.position,
    toState.position,
    transition.controlPoint
  );

  // Calculate midpoint for label positioning
  const [midpoint, setMidpoint] = useState({ x: 0, y: 0 });

  // Watch path reference and recalculate midpoint when necessary
  useEffect(() => {
    if (pathRef.current) {
      const pathLength = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(pathLength / 2);
      setMidpoint(point);
    }
  }, [pathRef.current, fromState.position, toState.position, transition.controlPoint]);

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
    const inputs = e.target.value.split(',').map(i => i.trim()).filter(i => i);
    dispatch({
      type: 'UPDATE_TRANSITION',
      payload: { ...transition, input: inputs.join(', ') }
    });
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

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
        className="overflow-visible"
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
              {[...Array.from(automaton.alphabet), 'ε'].map((input) => {
                // NFAモードでは複数入力を許可（カンマ区切り）
                const currentInputs = transition.input.split(',').map(i => i.trim());
                const isSelected = currentInputs.includes(input);
                
                return (
                  <DropdownMenuItem
                    key={input}
                    onClick={() => {
                      // 既存の遷移をチェック
                      const existingTransition = automaton.transitions.find(t => 
                        t.id !== transition.id && 
                        t.from === transition.from && 
                        t.to === transition.to && 
                        t.input === input
                      );

                      if (existingTransition) {
                        alert('同じ状態間の同じ入力による遷移が既に存在します。');
                        return;
                      }

                      if (automaton.type === 'NFA') {
                        const currentInputs = transition.input.split(',').map(i => i.trim());
                        // 入力値の重複をチェック
                        if (currentInputs.includes(input)) {
                          const newInputs = currentInputs.filter(i => i !== input);
                          dispatch({
                            type: 'UPDATE_TRANSITION',
                            payload: { ...transition, input: newInputs.join(', ') }
                          });
                        } else {
                          // 新しい入力を追加
                          dispatch({
                            type: 'UPDATE_TRANSITION',
                            payload: { ...transition, input: [...currentInputs, input].join(', ') }
                          });
                        }
                      } else {
                        dispatch({
                          type: 'UPDATE_TRANSITION',
                          payload: { ...transition, input }
                        });
                      }
                    }}
                  >
                    <span className="mr-2">{input}</span>
                    {automaton.type === 'NFA' && isSelected && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
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
        </div>
      </foreignObject>
    </g>
  );
}
