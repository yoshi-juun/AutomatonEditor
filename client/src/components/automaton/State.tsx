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
      e.preventDefault();
      dispatch({ type: 'SELECT_STATE', payload: state.id });
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

      // ドラッグ開始時に選択状態を設定
      dispatch({ type: 'SELECT_STATE', payload: state.id });

      const handleMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();  // デフォルトのドラッグ動作を防止
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

      const handleUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();  // デフォルトの動作を防止
        
        // イベントリスナーを確実に解除
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        
        // ドラッグ終了時に選択状態をクリア
        dispatch({ type: 'SELECT_STATE', payload: null });
      };

      // イベントリスナーを追加
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'transition' && selectedStateId && selectedStateId !== state.id) {
      const input = prompt('遷移の入力記号を入力してください:', '');
      if (input !== null) {  // キャンセルされた場合を除外
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: selectedStateId,
            to: state.id,
            input: input
          }
        });
      }
      dispatch({ type: 'SELECT_STATE', payload: null });
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
      onMouseUp={handleMouseUp}
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
