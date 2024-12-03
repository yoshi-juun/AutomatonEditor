import { useRef, useEffect } from 'react';
import { State } from './State';
import { Transition } from './Transition';
import { useAutomatonStore } from '../../lib/automatonStore';

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { automaton, mode, selectedStateId, dispatch } = useAutomatonStore();

  useEffect(() => {
    if (mode !== 'transition') {
      dispatch({ type: 'SELECT_STATE', payload: null });
    }
  }, [mode, dispatch]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'transition' && selectedStateId) {
      // キャンバスクリックで選択解除（トランジションモードの場合のみ）
      dispatch({ type: 'SELECT_STATE', payload: null });
      return;
    }

    if (mode !== 'state') return;

    const svg = svgRef.current;
    if (!svg) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(ctm.inverse());
    
    dispatch({
      type: 'ADD_STATE',
      payload: {
        x: svgPoint.x,
        y: svgPoint.y
      }
    });
  };

  // キーボードイベントの設定と解除
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      
      {automaton.transitions.map(transition => {
        const fromState = automaton.states.find(s => s.id === transition.from);
        const toState = automaton.states.find(s => s.id === transition.to);
        
        // 必要な状態が存在する場合のみ遷移を描画
        if (fromState && toState) {
          return (
            <Transition
              key={transition.id}
              transition={transition}
              fromState={fromState}
              toState={toState}
            />
          );
        }
        return null;
      })}
      
      {automaton.states.map(state => (
        <State key={state.id} state={state} />
      ))}
    </svg>
  );
}
