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

  const handleDragStart = (e: React.MouseEvent) => {
    if (mode !== 'drag') return;
    
    const svg = stateRef.current?.ownerSVGElement;
    if (!svg) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    // マウスの初期位置を記録
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(ctm.inverse());

    // ドラッグオフセットを計算
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
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'accepting') {
      dispatch({
        type: 'UPDATE_STATE',
        payload: { ...state, isAccepting: !state.isAccepting }
      });
      return;
    }

    if (mode === 'delete') {
      dispatch({ type: 'DELETE_STATE', payload: state.id });
      return;
    }

    if (mode === 'transition') {
      if (selectedStateId === null) {
        dispatch({ type: 'SELECT_STATE', payload: state.id });
      } else if (selectedStateId !== state.id) {
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: selectedStateId,
            to: state.id,
            input: '0'
          }
        });
        dispatch({ type: 'SELECT_STATE', payload: null });
      }
      return;
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
      onClick={handleClick}
      onMouseDown={handleDragStart}
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
          ${state.isAccepting ? 'stroke-[3]' : ''}
          ${useAutomatonStore.getState().simulation.currentStates.has(state.id) ? 'fill-green-100' : ''}
          ${useAutomatonStore.getState().simulation.isRunning && 
            useAutomatonStore.getState().simulation.step >= useAutomatonStore.getState().simulation.input.length && 
            useAutomatonStore.getState().simulation.currentStates.has(state.id) && state.isAccepting ? 'fill-green-200' : ''}
          ${useAutomatonStore.getState().simulation.isRunning && 
            useAutomatonStore.getState().simulation.step >= useAutomatonStore.getState().simulation.input.length && 
            useAutomatonStore.getState().simulation.currentStates.has(state.id) && !state.isAccepting ? 'fill-red-200' : ''}
        `}
      />
      {state.isAccepting && (
        <circle
          r="22"
          className="fill-none stroke-primary stroke-2"
        />
      )}

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
