import { useState, useRef } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { State as StateType } from '../../lib/automatonTypes';
import { Input } from '@/components/ui/input';

interface StateProps {
  state: StateType;
}

export function State({ state }: StateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mode, selectedStateId, dispatch } = useAutomatonStore();
  const stateRef = useRef<SVGGElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'delete') {
      dispatch({ type: 'DELETE_STATE', payload: state.id });
      return;
    }

    if (mode === 'transition') {
      // 選択状態を視覚的に表示
      dispatch({ type: 'SELECT_STATE', payload: state.id });
      
      if (selectedStateId && selectedStateId !== state.id) {
        // 2つの異なる状態が選択された場合のみ遷移を作成
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: selectedStateId,
            to: state.id,
            input: '0'
          }
        });
      }
      return;
    }

    if (mode === 'drag') {
      const svg = stateRef.current?.ownerSVGElement;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(ctm.inverse());

      const offsetX = svgPoint.x - state.position.x;
      const offsetY = svgPoint.y - state.position.y;

      const handleMove = (moveEvent: MouseEvent) => {
        const movePoint = svg.createSVGPoint();
        movePoint.x = moveEvent.clientX;
        movePoint.y = moveEvent.clientY;
        const moveSvgPoint = movePoint.matrixTransform(ctm.inverse());

        dispatch({
          type: 'UPDATE_STATE',
          payload: {
            ...state,
            position: {
              x: moveSvgPoint.x - offsetX,
              y: moveSvgPoint.y - offsetY
            }
          }
        });
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_STATE',
      payload: { ...state, name: e.target.value }
    });
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  return (
    <g
      ref={stateRef}
      transform={`translate(${state.position.x},${state.position.y})`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="cursor-move"
    >
      {state.isInitial && (
        <path
          d={`M ${-50} 0 L ${-25} 0`}
          className="stroke-primary stroke-2"
          markerEnd="url(#arrowhead)"
        />
      )}

      <circle
        r="25"
        className={`
          fill-background
          stroke-primary
          ${mode === 'transition' && selectedStateId === state.id ? 'stroke-[4] stroke-blue-500' : 'stroke-2'}
          ${state.isAccepting ? 'double-circle' : ''}
        `}
      />

      {isEditing ? (
        <foreignObject x="-20" y="-12" width="40" height="24">
          <Input
            type="text"
            value={state.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoFocus
            className="w-full h-full text-center bg-transparent border-none"
          />
        </foreignObject>
      ) : (
        <text
          className="text-sm font-medium text-foreground"
          textAnchor="middle"
          dy=".3em"
        >
          {state.name}
        </text>
      )}
    </g>
  );
}
