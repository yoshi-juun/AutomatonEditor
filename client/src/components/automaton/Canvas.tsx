import { useRef, useEffect } from 'react';
import { State } from './State';
import { Transition } from './Transition';
import { useAutomatonStore } from '../../lib/automatonStore';

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { automaton, mode, selectedStateId, dispatch } = useAutomatonStore();

  // モード変更時に選択をクリア
  useEffect(() => {
    if (mode !== 'transition') {
      dispatch({ type: 'SELECT_STATE', payload: null });
    }
  }, [mode, dispatch]);

  // キャンバス外クリック時に選択を解除
  useEffect(() => {
    const handleGlobalClick = () => {
      if (mode === 'transition') {
        dispatch({ type: 'SELECT_STATE', payload: null });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [mode, dispatch]);

  // キーボードイベント
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

  // ドラッグ終了時に状態をクリア
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      dispatch({ type: 'SELECT_STATE', payload: null });
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dispatch]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'transition' && selectedStateId) {
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
