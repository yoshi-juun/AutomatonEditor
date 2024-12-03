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
  },
  isNFA: false
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
            states: state.automaton.states.map(s =>
              s.id === action.payload.id ? action.payload : s
            )
          }
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
        set((state: AutomatonState) => {
          // 古い遷移を探す
          const oldTransition = state.automaton.transitions.find(t => t.id === action.payload.id);
          
          // 新しい遷移のリストを作成
          const newTransitions = state.automaton.transitions.map(t =>
            t.id === action.payload.id ? action.payload : t
          );
          
          // 新しいアルファベットセットを作成
          const newAlphabet = new Set(state.automaton.alphabet);
          // 古い入力値が他の遷移で使用されていない場合は削除
          if (oldTransition && !newTransitions.some(t => t.input === oldTransition.input && t.id !== oldTransition.id)) {
            newAlphabet.delete(oldTransition.input);
          }
          // 新しい入力値を追加
          newAlphabet.add(action.payload.input);
          
          return {
            ...state,
            automaton: {
              ...state.automaton,
              transitions: newTransitions,
              alphabet: newAlphabet
            }
          };
        });
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

      case 'SET_NFA_MODE':
        set((state: AutomatonState) => ({
          ...state,
          isNFA: action.payload,
          automaton: {
            ...state.automaton,
            type: action.payload ? 'NFA' : 'DFA'
          }
        }));
        break;

      case 'CONVERT_TO_DFA':
        set((state: AutomatonState) => {
          if (!state.isNFA) return state;

          // NFAからDFAへの変換ロジック
          const nfa = state.automaton;
          const newStates: State[] = [];
          const newTransitions: Transition[] = [];
          const processedStates = new Set<string>();
          const stateQueue: Set<string>[] = [];

          // 初期状態から開始
          const initialState = nfa.states.find(s => s.isInitial);
          if (!initialState) return state;

          stateQueue.push(new Set([initialState.id]));
          let stateCounter = 0;

          while (stateQueue.length > 0) {
            const currentStateSet = stateQueue.shift()!;
            const currentStateIds = Array.from(currentStateSet).sort().join(',');

            if (processedStates.has(currentStateIds)) continue;
            processedStates.add(currentStateIds);

            // 新しい状態を作成
            const newState: State = {
              id: `dfa_${stateCounter}`,
              name: `q${stateCounter}`,
              position: {
                x: 100 + (stateCounter % 3) * 150,
                y: 100 + Math.floor(stateCounter / 3) * 150
              },
              isInitial: stateCounter === 0,
              isAccepting: Array.from(currentStateSet).some(
                id => nfa.states.find(s => s.id === id)?.isAccepting
              )
            };
            newStates.push(newState);

            // 各入力文字に対する遷移を計算
            for (const input of nfa.alphabet) {
              const nextStates = new Set<string>();
              
              // 現在の状態セットの各状態から、入力に対する遷移先を収集
              currentStateSet.forEach(stateId => {
                nfa.transitions
                  .filter(t => t.from === stateId && t.input === input)
                  .forEach(t => nextStates.add(t.to));
              });

              if (nextStates.size > 0) {
                const nextStateIds = Array.from(nextStates).sort().join(',');
                let targetStateId: string;

                // 既存の状態セットを探す
                const existingStateIndex = Array.from(processedStates).findIndex(
                  ids => ids === nextStateIds
                );

                if (existingStateIndex === -1) {
                  // 新しい状態セットを追加
                  stateQueue.push(nextStates);
                  targetStateId = `dfa_${stateCounter + stateQueue.length}`;
                } else {
                  targetStateId = `dfa_${existingStateIndex}`;
                }

                // 新しい遷移を追加
                newTransitions.push({
                  id: generateId(),
                  from: newState.id,
                  to: targetStateId,
                  input
                });
              }
            }

            stateCounter++;
          }

          return {
            ...state,
            isNFA: false,
            automaton: {
              ...state.automaton,
              type: 'DFA',
              states: newStates,
              transitions: newTransitions
            }
          };
        });
        break;
    }
  }
}));
