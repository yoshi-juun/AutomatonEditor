import { Automaton } from './automatonTypes';

// JSON形式へのエクスポート
export const exportToJSON = (automaton: Automaton): string => {
  return JSON.stringify(automaton, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  }, 2);
};

// JSON形式からのインポート
export const importFromJSON = (jsonString: string): Automaton => {
  const parsed = JSON.parse(jsonString);
  return {
    ...parsed,
    alphabet: new Set(parsed.alphabet)
  };
};

// DOT形式へのエクスポート
export const exportToDOT = (automaton: Automaton): string => {
  const lines: string[] = [];
  const graphType = automaton.type === 'DFA' ? 'DFA' : 'NFA';
  
  lines.push(`digraph ${graphType} {`);
  lines.push('  rankdir=LR;');
  
  // ノードの定義
  automaton.states.forEach(state => {
    const shape = state.isAccepting ? 'doublecircle' : 'circle';
    const initial = state.isInitial ? ' (initial)' : '';
    lines.push(`  ${state.id} [label="${state.name}${initial}", shape=${shape}];`);
  });
  
  // 初期状態のマーカー
  const initialState = automaton.states.find(s => s.isInitial);
  if (initialState) {
    lines.push(`  start [shape=none, label=""];`);
    lines.push(`  start -> ${initialState.id};`);
  }
  
  // エッジの定義
  automaton.transitions.forEach(transition => {
    lines.push(`  ${transition.from} -> ${transition.to} [label="${transition.input}"];`);
  });
  
  lines.push('}');
  return lines.join('\n');
};

// DOT形式からのインポート
export const importFromDOT = (dotString: string): Automaton => {
  const states: Automaton['states'] = [];
  const transitions: Automaton['transitions'] = [];
  const alphabet = new Set<string>();
  
  // ステート情報の抽出
  const stateRegex = /(\w+)\s*\[label="([^"]*)",\s*shape=(\w+)\]/g;
  let match;
  
  while ((match = stateRegex.exec(dotString)) !== null) {
    const [, id, label, shape] = match;
    const isInitial = label.includes('(initial)');
    const name = label.replace(' (initial)', '');
    
    states.push({
      id,
      name,
      position: { x: 100 + states.length * 150, y: 200 },
      isInitial,
      isAccepting: shape === 'doublecircle'
    });
  }
  
  // 遷移情報の抽出
  const transitionRegex = /(\w+)\s*->\s*(\w+)\s*\[label="([^"]*)"\]/g;
  while ((match = transitionRegex.exec(dotString)) !== null) {
    const [, from, to, input] = match;
    if (from !== 'start') {
      transitions.push({
        id: Math.random().toString(36).substr(2, 9),
        from,
        to,
        input
      });
      alphabet.add(input);
    }
  }
  
  // オートマトンの種類を判定
  const type = dotString.includes('digraph DFA') ? 'DFA' : 'NFA';
  
  return {
    states,
    transitions,
    alphabet,
    type
  };
};

// ファイルダウンロードヘルパー
export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
