import { useState, useCallback, useMemo } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, SkipForward, RotateCcw } from "lucide-react";

export function Simulator() {
  const [inputString, setInputString] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 必要な状態のみを選択する最適化されたセレクター
  const {
    states,
    alphabet,
    currentStates,
    step,
    input,
    isRunning,
    dispatch
  } = useAutomatonStore(state => ({
    states: state.automaton.states,
    alphabet: state.automaton.alphabet,
    currentStates: state.simulation.currentStates,
    step: state.simulation.step,
    input: state.simulation.input,
    isRunning: state.simulation.isRunning,
    dispatch: state.dispatch
  }));

  // シミュレーション状態の計算を最適化
  const simulationState = useMemo(() => {
    const hasAcceptingState = states.some(state => state.isAccepting);
    const accepting = Array.from(currentStates)
      .some(stateId => states.find(state => state.id === stateId)?.isAccepting);
    const currentStateNames = Array.from(currentStates)
      .map(id => states.find(state => state.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    if (!hasAcceptingState && isRunning) {
      setError('受理状態が設定されていません。状態を右クリックして受理状態を設定してください。');
    }

    return {
      isAccepting: accepting,
      currentStates: currentStateNames,
      hasAcceptingState
    };
  }, [currentStates, states, isRunning]);

  // 入力検証を最適化
  const validateInput = useCallback((input: string) => {
    if (!alphabet.size) return false;
    const validSymbols = Array.from(alphabet)
      .flatMap(s => s.split(',').map(i => i.trim()));
    return input.split('').every(char => validSymbols.includes(char));
  }, [alphabet]);

  // イベントハンドラーを最適化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputString(e.target.value);
    setError(null);
  }, []);

  const handleStart = useCallback(() => {
    if (!inputString) {
      setError('入力文字列を入力してください');
      return;
    }

    if (!validateInput(inputString)) {
      const validSymbols = Array.from(alphabet)
        .flatMap(s => s.split(',').map(i => i.trim()));
      setError(`使用可能な記号：${validSymbols.join(', ')}`);
      return;
    }

    dispatch({ type: 'START_SIMULATION', payload: inputString });
  }, [inputString, validateInput, alphabet, dispatch]);

  const handleStep = useCallback(() => {
    dispatch({ type: 'STEP_SIMULATION' });
  }, [dispatch]);

  const handleStop = useCallback(() => {
    dispatch({ type: 'STOP_SIMULATION' });
    setInputString('');
    setError(null);
  }, [dispatch]);

  // 入力表示を最適化
  const inputDisplay = useMemo(() => {
    if (!input) return null;

    return input.split('').map((char, index) => (
      <div
        key={index}
        className={`
          flex-shrink-0 w-8 h-8 flex items-center justify-center rounded
          ${index === step ? 'bg-primary text-primary-foreground' :
            index < step ? 'bg-muted text-muted-foreground' :
            'border border-border'
          }
          transition-all duration-200
        `}
      >
        {char}
      </div>
    ));
  }, [input, step]);

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
            disabled={isRunning}
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
        {!isRunning ? (
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
              disabled={step >= input.length}
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

      {isRunning && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Step: {step} / {input.length}
          </div>
          <div className="space-y-2 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">現在の状態:</span>
              <span className="text-sm bg-accent px-2 py-1 rounded">
                {simulationState.currentStates || '非受理'}
              </span>
            </div>
            
            {step < input.length && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">入力記号:</span>
                <span className="text-sm font-mono bg-accent px-2 py-1 rounded">
                  {input[step]}
                </span>
              </div>
            )}

            {input && (
              <div className="flex items-center space-x-1 overflow-x-auto py-2">
                {inputDisplay}
              </div>
            )}

            {(step >= input.length || currentStates.size === 0) && (
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
