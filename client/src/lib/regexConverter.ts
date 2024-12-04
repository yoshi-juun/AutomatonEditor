import { State, Transition } from './automatonTypes';
import { generateId } from './automatonUtils';

type RegexNode = {
  type: 'concat' | 'union' | 'kleene' | 'symbol';
  value?: string;
  left?: RegexNode;
  right?: RegexNode;
};

export class RegexConverter {
  private stateCounter: number = 0;
  private states: State[] = [];
  private transitions: Transition[] = [];

  private createState(isAccepting: boolean = false, isInitial: boolean = false): State {
    const state: State = {
      id: generateId(),
      name: `q${this.stateCounter++}`,
      position: {
        x: 100 + (this.stateCounter % 3) * 150,
        y: 100 + Math.floor(this.stateCounter / 3) * 150
      },
      isInitial,
      isAccepting
    };
    this.states.push(state);
    return state;
  }

  private createTransition(from: string, to: string, input: string): void {
    this.transitions.push({
      id: generateId(),
      from,
      to,
      input
    });
  }

  private parseRegex(regex: string): RegexNode {
    let index = 0;

    const parseUnion = (): RegexNode => {
      let node = parseConcat();
      while (index < regex.length && regex[index] === '|') {
        index++;
        node = {
          type: 'union',
          left: node,
          right: parseConcat()
        };
      }
      return node;
    };

    const parseConcat = (): RegexNode => {
      let node = parsePrimary();
      while (
        index < regex.length &&
        regex[index] !== ')' &&
        regex[index] !== '|'
      ) {
        node = {
          type: 'concat',
          left: node,
          right: parsePrimary()
        };
      }
      return node;
    };

    const parsePrimary = (): RegexNode => {
      let node: RegexNode;
      if (regex[index] === '(') {
        index++;
        node = parseUnion();
        if (regex[index] === ')') index++;
      } else {
        node = { type: 'symbol', value: regex[index] };
        index++;
      }

      while (index < regex.length && regex[index] === '*') {
        node = { type: 'kleene', left: node };
        index++;
      }
      return node;
    };

    return parseUnion();
  }

  private buildNFA(node: RegexNode): { start: State; end: State } {
    switch (node.type) {
      case 'symbol': {
        const start = this.createState();
        const end = this.createState();
        this.createTransition(start.id, end.id, node.value!);
        return { start, end };
      }

      case 'concat': {
        const left = this.buildNFA(node.left!);
        const right = this.buildNFA(node.right!);
        this.createTransition(left.end.id, right.start.id, 'ε');
        return { start: left.start, end: right.end };
      }

      case 'union': {
        const start = this.createState();
        const end = this.createState();
        const left = this.buildNFA(node.left!);
        const right = this.buildNFA(node.right!);
        
        this.createTransition(start.id, left.start.id, 'ε');
        this.createTransition(start.id, right.start.id, 'ε');
        this.createTransition(left.end.id, end.id, 'ε');
        this.createTransition(right.end.id, end.id, 'ε');
        
        return { start, end };
      }

      case 'kleene': {
        const start = this.createState();
        const end = this.createState();
        const inner = this.buildNFA(node.left!);
        
        this.createTransition(start.id, end.id, 'ε');
        this.createTransition(start.id, inner.start.id, 'ε');
        this.createTransition(inner.end.id, end.id, 'ε');
        this.createTransition(inner.end.id, inner.start.id, 'ε');
        
        return { start, end };
      }
    }
  }

  public convert(regex: string): { states: State[]; transitions: Transition[] } {
    this.stateCounter = 0;
    this.states = [];
    this.transitions = [];

    try {
      const ast = this.parseRegex(regex);
      const { start, end } = this.buildNFA(ast);
      
      start.isInitial = true;
      end.isAccepting = true;

      return {
        states: this.states,
        transitions: this.transitions
      };
    } catch (error) {
      console.error('正規表現の変換中にエラーが発生しました:', error);
      throw new Error('正規表現の構文が無効です。');
    }
  }
}
