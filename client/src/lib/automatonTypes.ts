export interface Point {
  x: number;
  y: number;
}

export interface State {
  id: string;
  name: string;
  position: Point;
  isInitial: boolean;
  isAccepting: boolean;
}

export interface Transition {
  id: string;
  from: string;
  to: string;
  input: string;
  controlPoint?: Point;
}

export interface Automaton {
  states: State[];
  transitions: Transition[];
  alphabet: Set<string>;
  type: 'DFA' | 'NFA';
}

export interface AutomatonState {
  automaton: Automaton;
  selectedStateId: string | null;
  selectedTransitionId: string | null;
  mode: 'state' | 'transition' | 'delete' | 'simulate' | 'drag';
  simulation: {
    input: string;
    currentStates: Set<string>;
    step: number;
    isRunning: boolean;
  };
}

export type AutomatonAction =
  | { type: 'ADD_STATE'; payload: Point }
  | { type: 'DELETE_STATE'; payload: string }
  | { type: 'UPDATE_STATE'; payload: State }
  | { type: 'ADD_TRANSITION'; payload: { from: string; to: string; input: string } }
  | { type: 'DELETE_TRANSITION'; payload: string }
  | { type: 'UPDATE_TRANSITION'; payload: Transition }
  | { type: 'SET_MODE'; payload: AutomatonState['mode'] }
  | { type: 'SELECT_STATE'; payload: string | null }
  | { type: 'SELECT_TRANSITION'; payload: string | null }
  | { type: 'START_SIMULATION'; payload: string }
  | { type: 'STEP_SIMULATION' }
  | { type: 'STOP_SIMULATION' }
  | { type: 'TOGGLE_AUTOMATON_TYPE' }
  | { type: 'CONVERT_TO_DFA' };
