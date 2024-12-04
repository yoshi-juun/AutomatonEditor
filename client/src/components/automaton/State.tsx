import { useState, useRef } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { State as StateType } from '../../lib/automatonTypes';
import { Input } from '@/components/ui/input';

interface StateProps {
  state: StateType;
}

export function State({ state }: StateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const stateRef = useRef<SVGGElement>(null);
  
  // Zustand storeから必要な状態のみを取得
  const mode = useAutomatonStore(state => state.mode);
  const selectedStateId = useAutomatonStore(state => state.selectedStateId);
  const simulation = useAutomatonStore(state => state.simulation);
  const dispatch = useAutomatonStore(state => state.dispatch);

  const handleDragStart = (e: React.MouseEvent) => {
    if (mode !== 'drag') return;
    
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
      } else if (selectedStateId === state.id) {
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: state.id,
            to: state.id,
            input: '0'
          }
        });
        dispatch({ type: 'SELECT_STATE', payload: null });
      } else {
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

  // シミュレーション状態に基づくスタイルの計算
  const isCurrentState = simulation.currentStates.has(state.id);
  const isSimulationComplete = simulation.step >= simulation.input.length;
  const isAcceptingState = state.isAccepting;

  const getStateStyle = () => {
    if (!isCurrentState) return '';
    if (!simulation.isRunning) return '';
    if (!isSimulationComplete) return 'fill-green-100';
    return isAcceptingState ? 'fill-green-200' : 'fill-red-200';
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
          ${getStateStyle()}
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
