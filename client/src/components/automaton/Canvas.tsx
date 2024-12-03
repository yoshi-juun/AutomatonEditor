import { useRef, useEffect } from 'react';
import { State } from './State';
import { Transition } from './Transition';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Point } from '../../lib/automatonTypes';

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { automaton, mode, dispatch } = useAutomatonStore();

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'state') return;

    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const position = point.matrixTransform(svg.getScreenCTM()?.inverse());
    dispatch({
      type: 'ADD_STATE',
      payload: { x: position.x, y: position.y }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedState = useAutomatonStore.getState().selectedStateId;
        const selectedTransition = useAutomatonStore.getState().selectedTransitionId;

        if (selectedState) {
          dispatch({ type: 'DELETE_STATE', payload: selectedState });
        } else if (selectedTransition) {
          dispatch({ type: 'DELETE_TRANSITION', payload: selectedTransition });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-background"
      onClick={handleCanvasClick}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            className="fill-primary"
          />
        </marker>
      </defs>
      
      {automaton.transitions.map(transition => (
        <Transition
          key={transition.id}
          transition={transition}
          fromState={automaton.states.find(s => s.id === transition.from)!}
          toState={automaton.states.find(s => s.id === transition.to)!}
        />
      ))}
      
      {automaton.states.map(state => (
        <State key={state.id} state={state} />
      ))}
    </svg>
  );
}
