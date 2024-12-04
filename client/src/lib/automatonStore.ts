import { create } from 'zustand';
import { AutomatonState, AutomatonAction, State, Transition } from './automatonTypes';
import { generateId } from './automatonUtils';
import { RegexConverter } from './regexConverter';
import { 
  exportToJSON,
  importFromJSON,
  exportToDOT,
  importFromDOT,
  downloadFile
} from './formatConverters';

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
          const { from, to } = action.payload;
          
          // 同じ状態間の既存の遷移を削除
          const filteredTransitions = state.automaton.transitions.filter(t => 
            !(t.from === from && t.to === to)
          );

          // 新しい遷移を追加
          const newTransition: Transition = {
            id: generateId(),
            ...action.payload
          };

          // アルファベットの更新（新しい入力値を追加）
          const newAlphabet = new Set([
            ...state.automaton.alphabet,
            ...action.payload.input.split(',').map(i => i.trim())
          ]);

          return {
            ...state,
            automaton: {
              ...state.automaton,
              transitions: [...filteredTransitions, newTransition],
              alphabet: newAlphabet
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
          const epsilonClosure = new Set<string>();
          
          // ε遷移による到達可能な状態を収集する関数
          const collectEpsilonClosure = (stateId: string) => {
            if (epsilonClosure.has(stateId)) return;
            epsilonClosure.add(stateId);
            
            state.automaton.transitions
              .filter(t => t.from === stateId && t.input === 'ε')
              .forEach(t => collectEpsilonClosure(t.to));
          };
          
          // 現在の状態からε遷移で到達可能な全状態を収集
          state.simulation.currentStates.forEach(stateId => {
            collectEpsilonClosure(stateId);
          });
          
          // ε遷移で到達可能な各状態から、現在の入力文字による遷移を収集
          epsilonClosure.forEach(stateId => {
            state.automaton.transitions
              .filter(t => {
                const inputs = t.input.split(',').map(i => i.trim());
                return t.from === stateId && inputs.includes(currentChar);
              })
              .forEach(t => nextStates.add(t.to));
          });
          
          // 遷移後の状態からさらにε遷移で到達可能な状態を収集
          const finalStates = new Set<string>();
          nextStates.forEach(stateId => {
            collectEpsilonClosure(stateId);
            finalStates.add(stateId);
          });
          epsilonClosure.forEach(stateId => finalStates.add(stateId));

          // 次の状態がない場合は非受理として停止
          if (nextStates.size === 0) {
            return {
              ...state,
              simulation: {
                ...state.simulation,
                currentStates: nextStates,
                step: state.simulation.input.length, // 強制的に終了
                isRunning: true // 実行中フラグは維持
              }
            };
          }

          return {
            ...state,
            simulation: {
              ...state.simulation,
              currentStates: finalStates,
              step: state.simulation.step + 1,
              isRunning: true
            }
          };
        });
        break;

      case 'STOP_SIMULATION':
        set((state: AutomatonState) => {
          // シミュレーション状態のみをリセット
          return {
            ...state,
            simulation: {
              input: '',
              currentStates: new Set<string>(),
              step: 0,
              isRunning: false
            }
          };
        });
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

          try {
            // 変換可能性チェック
            const nfa = state.automaton;
            const hasInvalidTransitions = nfa.states.some(state => {
              const outgoingTransitions = nfa.transitions.filter(t => t.from === state.id);
              const transitionInputs = outgoingTransitions.map(t => t.input);
              const uniqueInputs = new Set(transitionInputs);
              
              // 同じ入力で異なる状態に遷移する場合は変換不可
              return Array.from(uniqueInputs).some(input => {
                const transitionsWithInput = outgoingTransitions.filter(t => t.input === input);
                return transitionsWithInput.length > 1;
              });
            });

            if (hasInvalidTransitions) {
              alert('このNFAは決定性有限オートマトンに変換できません。同じ入力で複数の状態に遷移する状態が存在します。');
              return state;
            }

            // NFAからDFAへの変換ロジック
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
          } catch (error) {
            console.error('DFA変換中にエラーが発生しました:', error);
            alert('DFA変換中にエラーが発生しました。');
            return state;
          }
        });
        break;

      case 'CONVERT_REGEX':
        set((state: AutomatonState) => {
          try {
            const converter = new RegexConverter();
            const { states, transitions } = converter.convert(action.payload);
            
            return {
              ...state,
              isNFA: true,
              automaton: {
                ...state.automaton,
                type: 'NFA',
                states,
                transitions,
                alphabet: new Set(transitions
                  .map(t => t.input)
                  .filter(input => input !== 'ε')
                )
              }
            };
          } catch (error) {
            console.error('正規表現の変換中にエラーが発生しました:', error);
            return state;
          }
        });
        break;

      case 'IMPORT_AUTOMATON':
        set((state: AutomatonState) => {
          try {
            const automaton = action.payload.format === 'json'
              ? importFromJSON(action.payload.content)
              : importFromDOT(action.payload.content);

            return {
              ...state,
              isNFA: automaton.type === 'NFA',
              automaton
            };
          } catch (error) {
            console.error('オートマトンのインポート中にエラーが発生しました:', error);
            alert('ファイルの形式が正しくないか、破損している可能性があります。');
            return state;
          }
        });
        break;

      case 'EXPORT_AUTOMATON':
        set((state: AutomatonState) => {
          try {
            // JSON形式でのみエクスポート
            const jsonContent = exportToJSON(state.automaton);
            downloadFile(jsonContent, `automaton_${Date.now()}.json`);
            return state;
          } catch (error) {
            console.error('オートマトンのエクスポート中にエラーが発生しました:', error);
            alert('エクスポート中にエラーが発生しました。');
            return state;
          }
        });
        break;

      case 'MINIMIZE_DFA':
        set((state: AutomatonState) => {
          if (state.isNFA || state.automaton.type !== 'DFA') {
            alert('最小化はDFAのみで実行可能です。');
            return state;
          }

          try {
            const { states, transitions, alphabet } = state.automaton;

            // 1. 到達可能な状態の特定
            const reachableStates = new Set<string>();
            const queue = [states.find(s => s.isInitial)?.id];
            while (queue.length > 0) {
              const currentId = queue.shift()!;
              if (!reachableStates.has(currentId)) {
                reachableStates.add(currentId);
                transitions
                  .filter(t => t.from === currentId)
                  .forEach(t => queue.push(t.to));
              }
            }

            // 到達不能な状態を除外
            const filteredStates = states.filter(s => reachableStates.has(s.id));
            const filteredTransitions = transitions.filter(t => 
              reachableStates.has(t.from) && reachableStates.has(t.to)
            );

            // 2. 等価な状態の特定
            let partition = [
              filteredStates.filter(s => s.isAccepting).map(s => s.id),
              filteredStates.filter(s => !s.isAccepting).map(s => s.id)
            ].filter(group => group.length > 0);

            let changed = true;
            while (changed) {
              changed = false;
              const newPartition: string[][] = [];

              for (const group of partition) {
                const subgroups = new Map<string, string[]>();

                for (const stateId of group) {
                  const signature = Array.from(alphabet).map(input => {
                    const transition = filteredTransitions.find(t => 
                      t.from === stateId && t.input === input
                    );
                    if (!transition) return 'none';
                    return partition.findIndex(p => p.includes(transition.to)).toString();
                  }).join(',');

                  if (!subgroups.has(signature)) {
                    subgroups.set(signature, []);
                  }
                  subgroups.get(signature)!.push(stateId);
                }

                if (subgroups.size > 1) {
                  changed = true;
                  newPartition.push(...Array.from(subgroups.values()));
                } else {
                  newPartition.push(group);
                }
              }

              partition = newPartition;
            }

            // 3. 新しい状態集合の作成
            const newStates: State[] = partition.map((group, i) => {
              const originalState = filteredStates.find(s => s.id === group[0])!;
              return {
                id: `min_${i}`,
                name: `q${i}`,
                position: {
                  x: 100 + (i % 3) * 150,
                  y: 100 + Math.floor(i / 3) * 150
                },
                isInitial: group.some(id => 
                  filteredStates.find(s => s.id === id)?.isInitial
                ),
                isAccepting: group.some(id => 
                  filteredStates.find(s => s.id === id)?.isAccepting
                )
              };
            });

            // 4. 新しい遷移の作成
            const newTransitions: Transition[] = [];
            for (const [groupIndex, group] of partition.entries()) {
              const representativeId = group[0];
              const fromStateId = `min_${groupIndex}`;

              for (const input of alphabet) {
                const originalTransition = filteredTransitions.find(t => 
                  t.from === representativeId && t.input === input
                );
                
                if (originalTransition) {
                  const toGroupIndex = partition.findIndex(p => 
                    p.includes(originalTransition.to)
                  );
                  
                  if (toGroupIndex !== -1) {
                    newTransitions.push({
                      id: generateId(),
                      from: fromStateId,
                      to: `min_${toGroupIndex}`,
                      input
                    });
                  }
                }
              }
            }

            return {
              ...state,
              automaton: {
                ...state.automaton,
                states: newStates,
                transitions: newTransitions
              }
            };
          } catch (error) {
            console.error('DFA最小化中にエラーが発生しました:', error);
            alert('DFA最小化中にエラーが発生しました。');
            return state;
          }
        });
        break;
    }
  }
}));
