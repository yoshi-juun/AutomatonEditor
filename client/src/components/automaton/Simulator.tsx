import { useState, useCallback, useMemo } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, SkipForward, RotateCcw } from "lucide-react";
import { AutomatonState } from '../../lib/automatonTypes';

// Stable selector with proper typing
const selector = (state: AutomatonState & { dispatch: (action: any) => void }) => ({
  automaton: state.automaton,
  simulation: state.simulation,
  dispatch: state.dispatch
});

export function Simulator() {
  const [inputString, setInputString] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use memoized store values with stable reference
  const storeValues = useAutomatonStore(selector);
  const { automaton, simulation, dispatch } = storeValues;

  // Memoize validation function
  const validateInput = useMemo(() => {
    if (!automaton.alphabet.size) return () => false;
    const validSymbols = Array.from(automaton.alphabet)
      .flatMap(s => s.split(',').map(i => i.trim()));
    return (input: string) => input.split('').every(char => validSymbols.includes(char));
  }, [automaton.alphabet]);

  // Memoized handlers with stable references
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputString(newValue);
    setError(null);
  }, []);

  const handleStart = useCallback(() => {
    if (!inputString) {
      setError('入力文字列を入力してください');
      return;
    }

    const inputSymbols = inputString.split('').filter(char => char !== ' ');
    const validSymbols = Array.from(automaton.alphabet)
      .flatMap(s => s.split(',').map(i => i.trim()));
    
    const invalidSymbols = inputSymbols.filter(symbol => !validSymbols.includes(symbol));
    if (invalidSymbols.length > 0) {
      setError(`以下の入力記号は使用できません：${invalidSymbols.join(', ')}\n使用可能な記号：${validSymbols.join(', ')}`);
      return;
    }

    dispatch({ type: 'START_SIMULATION', payload: inputString });
  }, [inputString, automaton.alphabet, dispatch]);

  const handleStep = useCallback(() => {
    dispatch({ type: 'STEP_SIMULATION' });
  }, [dispatch]);

  const handleStop = useCallback(() => {
    dispatch({ type: 'STOP_SIMULATION' });
    setInputString('');
    setError(null);
  }, [dispatch]);

  // Memoize simulation state calculations with stable reference
  const simulationState = useMemo(() => {
    if (!simulation.isRunning) {
      return {
        isAccepting: false,
        currentStates: '',
        hasAcceptingState: false
      };
    }

    const hasAcceptingState = automaton.states.some(state => state.isAccepting);
    const accepting = Array.from(simulation.currentStates)
      .some(stateId => automaton.states.find(state => state.id === stateId)?.isAccepting);
    const states = Array.from(simulation.currentStates)
      .map(id => automaton.states.find(state => state.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    return {
      isAccepting: accepting,
      currentStates: states,
      hasAcceptingState
    };
  }, [simulation.isRunning, simulation.currentStates, automaton.states]);

  // Memoize input display with stable reference
  const inputDisplay = useMemo(() => {
    if (!simulation.input) return null;

    return simulation.input.split('').map((char: string, index: number) => (
      <div
        key={index}
        className={`
          flex-shrink-0 w-8 h-8 flex items-center justify-center rounded
          ${index === simulation.step ? 'bg-primary text-primary-foreground' :
            index < simulation.step ? 'bg-muted text-muted-foreground' :
            'border border-border'
          }
          transition-all duration-200
        `}
      >
        {char}
      </div>
    ));
  }, [simulation.input, simulation.step]);

  // Move accepting state check outside of render cycle
  useMemo(() => {
    if (simulation.isRunning && !simulationState.hasAcceptingState) {
      setError('受理状態が設定されていません。状態を右クリックして受理状態を設定してください。');
    }
  }, [simulation.isRunning, simulationState.hasAcceptingState]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="input-string">Input String</Label>
        <div className="flex space-x-2">
          <Input
            id="input-string"
            value={inputString}
            onChange={handleInputChange}
            placeholder="Enter input string..."
            disabled={simulation.isRunning}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertDescription className="flex items-center space-x-2">
            <span className="font-medium">エラー:</span>
            <span>{error}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-2">
        {!simulation.isRunning ? (
          <Button 
            onClick={handleStart}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleStep}
              disabled={simulation.step >= simulation.input.length}
              className="flex-1"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Step
            </Button>
            <Button
              variant="destructive"
              onClick={handleStop}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </>
        )}
      </div>

      {simulation.isRunning && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Step: {simulation.step} / {simulation.input.length}
          </div>
          <div className="space-y-2 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">現在の状態:</span>
              <span className="text-sm bg-accent px-2 py-1 rounded">
                {simulationState.currentStates || '非受理'}
              </span>
            </div>
            
            {simulation.step < simulation.input.length && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">入力記号:</span>
                <span className="text-sm font-mono bg-accent px-2 py-1 rounded">
                  {simulation.input[simulation.step]}
                </span>
              </div>
            )}

            {simulation.input && (
              <div className="flex items-center space-x-1 overflow-x-auto py-2">
                {inputDisplay}
              </div>
            )}

            {(simulation.step >= simulation.input.length || simulation.currentStates.size === 0) && (
              <div className={`mt-2 p-3 rounded-lg ${
                simulationState.isAccepting ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <div className={`flex items-center justify-center text-sm font-medium ${
                  simulationState.isAccepting ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {simulationState.isAccepting ? (
                    <>✓ 入力文字列は受理されました</>
                  ) : (
                    <>✕ 入力文字列は受理されませんでした</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
