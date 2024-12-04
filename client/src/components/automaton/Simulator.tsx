import { useState } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

export function Simulator() {
  const [inputString, setInputString] = useState('');
  const { automaton, simulation, dispatch } = useAutomatonStore();
  const [error, setError] = useState<string | null>(null);

  const validateInput = (input: string): boolean => {
    const isValidChar = (char: string) => automaton.alphabet.has(char);
    return input.split('').every(isValidChar);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInputString(newInput);
    setError(null);
  };

  const handleStart = () => {
    if (!inputString) {
      setError('入力文字列を入力してください');
      return;
    }

    const inputSymbols = inputString.split('').filter(char => char !== ' ');
    const validSymbols = Array.from(automaton.alphabet).flatMap(s => s.split(',').map(i => i.trim()));
    
    const invalidSymbols = inputSymbols.filter(symbol => !validSymbols.includes(symbol));
    if (invalidSymbols.length > 0) {
      setError(`以下の入力記号は使用できません：${invalidSymbols.join(', ')}
使用可能な記号：${validSymbols.join(', ')}`);
      return;
    }

    dispatch({ type: 'START_SIMULATION', payload: inputString });
  };

  const handleStep = () => {
    dispatch({ type: 'STEP_SIMULATION' });
  };

  const handleStop = () => {
    dispatch({ type: 'STOP_SIMULATION' });
    setInputString('');
    setError(null);
  };

  const isAccepting = () => {
    const hasAcceptingState = automaton.states.some(s => s.isAccepting);
    if (!hasAcceptingState) {
      setError('受理状態が設定されていません。状態を右クリックして受理状態を設定してください。');
      return false;
    }
    
    return Array.from(simulation.currentStates).some(stateId => 
      automaton.states.find(s => s.id === stateId)?.isAccepting
    );
  };

  const getSimulationStatus = () => {
    if (!simulation.isRunning) return null;
    if (simulation.step >= simulation.input.length) {
      return isAccepting() 
        ? 'String accepted!' 
        : 'String rejected - ended in non-accepting state';
    }
    return `Current symbol: ${simulation.input[simulation.step]}`;
  };

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
                {simulation.currentStates.size > 0 
                  ? Array.from(simulation.currentStates).map(id => {
                      const state = automaton.states.find(s => s.id === id);
                      return state?.name;
                    }).join(', ')
                  : '初期状態'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">入力記号:</span>
              <span className="text-sm font-mono bg-accent px-2 py-1 rounded">
                {simulation.step < simulation.input.length ? simulation.input[simulation.step] : '完了'}
              </span>
            </div>

            {simulation.input && (
              <div className="flex items-center space-x-1 overflow-x-auto py-2">
                {simulation.input.split('').map((char, i) => (
                  <div
                    key={i}
                    className={`
                      flex-shrink-0 w-8 h-8 flex items-center justify-center rounded
                      ${i === simulation.step ? 'bg-primary text-primary-foreground' :
                        i < simulation.step ? 'bg-muted text-muted-foreground' :
                        'border border-border'
                      }
                      transition-all duration-200
                    `}
                  >
                    {char}
                  </div>
                ))}
              </div>
            )}

            {simulation.step >= simulation.input.length && (
              <div className={`mt-2 p-3 rounded-lg ${
                isAccepting() ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <div className={`flex items-center justify-center text-sm font-medium ${
                  isAccepting() ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {isAccepting() ? (
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
