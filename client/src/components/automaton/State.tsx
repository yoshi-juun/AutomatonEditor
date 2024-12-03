import { useState, useEffect } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { State as StateType } from '../../lib/automatonTypes';
import { Input } from '@/components/ui/input';

interface StateProps {
  state: StateType;
}

export function State({ state }: StateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { mode, selectedStateId, dispatch } = useAutomatonStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    // イベントの伝播を停止
    e.stopPropagation();
    
    if (mode === 'delete') {
      dispatch({ type: 'DELETE_STATE', payload: state.id });
      return;
    }

    // ドラッグモード時のみ処理
    if (mode === 'drag') {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      dispatch({ type: 'SELECT_STATE', payload: state.id });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (selectedStateId !== state.id) return;

    dispatch({
      type: 'UPDATE_STATE',
      payload: {
        ...state,
        position: {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        }
      }
    });
  };

  const handleMouseUp = () => {
    if (mode === 'transition' && selectedStateId && selectedStateId !== state.id) {
      dispatch({
        type: 'ADD_TRANSITION',
        payload: {
          from: selectedStateId,
          to: state.id,
          input: '0'
        }
      });
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

  useEffect(() => {
    if (selectedStateId === state.id) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [selectedStateId, state.id]);

  return (
    <g
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
