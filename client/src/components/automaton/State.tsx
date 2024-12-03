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
    e.stopPropagation();
    
    if (mode === 'delete') {
      dispatch({ type: 'DELETE_STATE', payload: state.id });
      return;
    }

    if (mode === 'drag') {
      const svg = (e.target as SVGElement).ownerSVGElement;
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
      
      setDragOffset({
        x: transformedPoint.x - state.position.x,
        y: transformedPoint.y - state.position.y
      });
      dispatch({ type: 'SELECT_STATE', payload: state.id });
    } else if (mode === 'transition') {
      dispatch({ type: 'SELECT_STATE', payload: state.id });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (selectedStateId !== state.id || mode !== 'drag') return;

    const svg = document.querySelector('svg');
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    dispatch({
      type: 'UPDATE_STATE',
      payload: {
        ...state,
        position: {
          x: transformedPoint.x - dragOffset.x,
          y: transformedPoint.y - dragOffset.y
        }
      }
    });
  };

  const handleMouseUp = () => {
    if (mode === 'transition') {
      if (selectedStateId && selectedStateId !== state.id) {
        dispatch({
          type: 'ADD_TRANSITION',
          payload: {
            from: selectedStateId,
            to: state.id,
            input: '0'
          }
        });
      }
      dispatch({ type: 'SELECT_STATE', payload: null });
    } else if (mode === 'drag') {
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

  useEffect(() => {
    if (selectedStateId === state.id && mode === 'drag') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [selectedStateId, state.id, mode, handleMouseMove, handleMouseUp]);

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
