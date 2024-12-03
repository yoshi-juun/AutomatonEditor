import { create } from 'zustand';
import { AutomatonState, AutomatonAction, State, Transition } from './automatonTypes';
import { generateId } from './automatonUtils';

const initialState: AutomatonState = {
  automaton: {
    states: [],
    transitions: [],
    alphabet: new Set<string>(),
    type: 'DFA'
  },
  selectedStateId: null,
  selectedTransitionId: null,
  mode: 'state',
  simulation: {
    input: '',
    currentStates: new Set<string>(),
    step: 0,
    isRunning: false
  }
};

export const useAutomatonStore = create<
  AutomatonState & {
    dispatch: (action: AutomatonAction) => void;
  }
>((set) => ({
  ...initialState,
  dispatch: (action: AutomatonAction) => {
    switch (action.type) {
      case 'ADD_STATE':
        set((state: AutomatonState) => {
          const newState: State = {
            id: generateId(),
            name: `q${state.automaton.states.length}`,
            position: action.payload,
            isInitial: state.automaton.states.length === 0,
            isAccepting: false
          };
          return {
            ...state,
            automaton: {
              ...state.automaton,
              states: [...state.automaton.states, newState]
            }
          };
        });
        break;

      case 'DELETE_STATE':
        set((state: AutomatonState) => ({
          ...state,
          automaton: {
            ...state.automaton,
            states: state.automaton.states.filter(s => s.id !== action.payload),
            transitions: state.automaton.transitions.filter(
              t => t.from !== action.payload && t.to !== action.payload
            )
          }
        }));
        break;

      case 'UPDATE_STATE':
        set((state: AutomatonState) => ({
          ...state,
          automaton: {
            ...state.automaton,
            states: state.automaton.states.map((s) =>
              s.id === action.payload.id ? action.payload : s
            ),
          },
        }));
        break;

      case 'ADD_TRANSITION':
        set((state: AutomatonState) => {
          const newTransition: Transition = {
            id: generateId(),
            ...action.payload
          };
          return {
            ...state,
            automaton: {
              ...state.automaton,
              transitions: [...state.automaton.transitions, newTransition],
              alphabet: new Set([...state.automaton.alphabet, action.payload.input])
            }
          };
        });
        break;

      case 'DELETE_TRANSITION':
        set((state: AutomatonState) => ({
          ...state,
          automaton: {
            ...state.automaton,
            transitions: state.automaton.transitions.filter(t => t.id !== action.payload)
          }
        }));
        break;

      case 'UPDATE_TRANSITION':
        set((state: AutomatonState) => ({
          ...state,
          automaton: {
            ...state.automaton,
            transitions: state.automaton.transitions.map(t =>
              t.id === action.payload.id ? action.payload : t
            )
          }
        }));
        break;

      case 'SET_MODE':
        set((state: AutomatonState) => ({ ...state, mode: action.payload }));
        break;

      case 'SELECT_STATE':
        set((state: AutomatonState) => ({ ...state, selectedStateId: action.payload }));
        break;

      case 'SELECT_TRANSITION':
        set((state: AutomatonState) => ({ ...state, selectedTransitionId: action.payload }));
        break;

      case 'START_SIMULATION':
        set((state: AutomatonState) => {
          const initialState = state.automaton.states.find(s => s.isInitial);
          return {
            ...state,
            simulation: {
              input: action.payload,
              currentStates: new Set(initialState ? [initialState.id] : []),
              step: 0,
              isRunning: true
            }
          };
        });
        break;

      case 'STEP_SIMULATION':
        set((state: AutomatonState) => {
          if (!state.simulation.isRunning) return state;
          
          const currentChar = state.simulation.input[state.simulation.step];
          const nextStates = new Set<string>();
          
          state.simulation.currentStates.forEach((stateId: string) => {
            state.automaton.transitions
              .filter(t => t.from === stateId && t.input === currentChar)
              .forEach(t => nextStates.add(t.to));
          });

          return {
            ...state,
            simulation: {
              ...state.simulation,
              currentStates: nextStates,
              step: state.simulation.step + 1,
              isRunning: state.simulation.step < state.simulation.input.length - 1
            }
          };
        });
        break;

      case 'STOP_SIMULATION':
        set((state: AutomatonState) => ({
          ...state,
          simulation: { ...initialState.simulation }
        }));
        break;
    }
  }
}));
