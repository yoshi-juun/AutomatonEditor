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
      case 'TOGGLE_AUTOMATON_TYPE':
        set((state: AutomatonState) => ({
          ...state,
          automaton: {
            ...state.automaton,
            type: state.automaton.type === 'DFA' ? 'NFA' : 'DFA'
          }
        }));
        break;

      case 'CONVERT_TO_DFA':
        set((state: AutomatonState) => {
          if (state.automaton.type === 'DFA') return state;

          // NFAからDFAへの変換ロジックを実装
          const nfaStates = state.automaton.states;
          const nfaTransitions = state.automaton.transitions;
          const alphabet = Array.from(state.automaton.alphabet);
          
          // 新しいDFA用の状態とトランジションを格納する配列
          const dfaStates: State[] = [];
          const dfaTransitions: Transition[] = [];
          
          // 初期状態の集合を作成
          const initialState = nfaStates.find(s => s.isInitial);
          if (!initialState) return state;
          
          // 状態セットをキーとして、DFAの状態IDを値として持つマップ
          const stateSetMap = new Map<string, string>();
          
          // 処理待ちの状態セット
          const queue: Set<string>[] = [new Set([initialState.id])];
          
          // 既に処理した状態セット
          const processedStateSets = new Set<string>();
          
          while (queue.length > 0) {
            const currentStateSet = queue.shift()!;
            const currentStateSetKey = Array.from(currentStateSet).sort().join(',');
            
            if (processedStateSets.has(currentStateSetKey)) continue;
            processedStateSets.add(currentStateSetKey);
            
            // 新しいDFA状態を作成
            const newStateId = generateId();
            stateSetMap.set(currentStateSetKey, newStateId);
            
            // DFA状態の名前を生成（元の状態名を組み合わせる）
            const stateName = Array.from(currentStateSet)
              .map(id => nfaStates.find(s => s.id === id)?.name)
              .filter(Boolean)
              .join(',');
            
            // 新しい状態を追加
            dfaStates.push({
              id: newStateId,
              name: `{${stateName}}`,
              position: {
                x: Math.random() * 500, // より良い位置計算が必要
                y: Math.random() * 500
              },
              isInitial: currentStateSet.has(initialState.id),
              isAccepting: Array.from(currentStateSet).some(id => 
                nfaStates.find(s => s.id === id)?.isAccepting
              )
            });
            
            // 各入力文字について遷移先を計算
            for (const input of alphabet) {
              const nextStateSet = new Set<string>();
              
              // 現在の状態セットの各状態からの遷移を調べる
              for (const stateId of currentStateSet) {
                const transitions = nfaTransitions.filter(
                  t => t.from === stateId && t.input === input
                );
                
                for (const transition of transitions) {
                  nextStateSet.add(transition.to);
                }
              }
              
              if (nextStateSet.size > 0) {
                const nextStateSetKey = Array.from(nextStateSet).sort().join(',');
                
                // 新しい状態セットをキューに追加
                if (!processedStateSets.has(nextStateSetKey)) {
                  queue.push(nextStateSet);
                }
                
                // DFAのトランジションを追加
                dfaTransitions.push({
                  id: generateId(),
                  from: newStateId,
                  to: stateSetMap.get(nextStateSetKey) || '',
                  input
                });
              }
            }
          }
          
          return {
            ...state,
            automaton: {
              states: dfaStates,
              transitions: dfaTransitions,
              alphabet: state.automaton.alphabet,
              type: 'DFA'
            }
          };
        });
        break;
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
          // DFAモードの場合、同じ状態から同じ入力での遷移が既に存在するかチェック
          if (state.automaton.type === 'DFA') {
            const existingTransition = state.automaton.transitions.find(
              t => t.from === action.payload.from && t.input === action.payload.input
            );
            if (existingTransition) {
              console.warn('Transition with same input already exists in DFA mode');
              return state;
            }
          }

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
          
          // NFAの場合、同じ入力で複数の遷移が可能
          state.simulation.currentStates.forEach((stateId: string) => {
            const validTransitions = state.automaton.transitions.filter(
              t => t.from === stateId && t.input === currentChar
            );
            
            validTransitions.forEach(t => nextStates.add(t.to));
          });

          // DFAの場合、各状態から特定の入力に対して1つの遷移のみ許可
          if (state.automaton.type === 'DFA' && nextStates.size > 1) {
            console.warn('Multiple transitions found in DFA mode');
          }

          const isLastStep = state.simulation.step >= state.simulation.input.length - 1;
          const hasNextStates = nextStates.size > 0;

          return {
            ...state,
            simulation: {
              ...state.simulation,
              currentStates: nextStates,
              step: state.simulation.step + 1,
              isRunning: !isLastStep && hasNextStates
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
