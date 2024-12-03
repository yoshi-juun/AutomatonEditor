import { useState, useRef, useEffect } from 'react';
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
      if (selectedStateId === null) {
        // 最初の状態を選択
        dispatch({ type: 'SELECT_STATE', payload: state.id });
      } else if (selectedStateId !== state.id) {
        // 2つ目の状態を選択し、遷移を作成
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: selectedStateId,
            to: state.id,
            input: '0'  // デフォルト入力
          }
        });
        dispatch({ type: 'SELECT_STATE', payload: null });  // 選択をリセット
      }
      return;
    }

    if (mode === 'drag') {
      const svg = stateRef.current?.ownerSVGElement;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      // クリックされた位置のSVG座標を計算
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(ctm.inverse());

      // ドラッグオフセットをクロージャで管理
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
      {/* Initial state marker */}
      {state.isInitial && (
        <path
          d={`M ${-50} 0 L ${-25} 0`}
          className="stroke-primary stroke-2"
          markerEnd="url(#arrowhead)"
        />
      )}

      {/* State circle */}
      <circle
        r="25"
        className={`
          fill-background
          stroke-primary
          stroke-2
          ${selectedStateId === state.id ? 'stroke-[3]' : ''}
          ${state.isAccepting ? 'double-circle' : ''}
        `}
      />

      {/* State label */}
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
