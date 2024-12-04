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

  // 必要な状態のみを選択的に取得
  const alphabet = useAutomatonStore(state => state.automaton.alphabet);
  const states = useAutomatonStore(state => state.automaton.states);
  const simulation = useAutomatonStore(state => state.simulation);
  const dispatch = useAutomatonStore(state => state.dispatch);

  // メモ化された検証関数
  const validateInput = useCallback((input: string): boolean => {
    const validSymbols = Array.from(alphabet).flatMap(s => s.split(',').map(i => i.trim()));
    return input.split('').every(char => validSymbols.includes(char));
  }, [alphabet]);

  // 入力ハンドラー
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInputString(newInput);
    setError(null);
  }, []);

  // シミュレーション開始
  const handleStart = useCallback(() => {
    if (!inputString) {
      setError('入力文字列を入力してください');
      return;
    }

    const inputSymbols = inputString.split('').filter(char => char !== ' ');
    const validSymbols = Array.from(alphabet).flatMap(s => s.split(',').map(i => i.trim()));
    
    const invalidSymbols = inputSymbols.filter(symbol => !validSymbols.includes(symbol));
    if (invalidSymbols.length > 0) {
      setError(`以下の入力記号は使用できません：${invalidSymbols.join(', ')}
使用可能な記号：${validSymbols.join(', ')}`);
      return;
    }

    dispatch({ type: 'START_SIMULATION', payload: inputString });
  }, [inputString, alphabet, dispatch]);

  // シミュレーションステップ実行
  const handleStep = useCallback(() => {
    dispatch({ type: 'STEP_SIMULATION' });
  }, [dispatch]);

  // シミュレーション停止
  const handleStop = useCallback(() => {
    dispatch({ type: 'STOP_SIMULATION' });
    setInputString('');
    setError(null);
  }, [dispatch]);

  // メモ化された受理状態チェック
  const isAccepting = useMemo(() => {
    const hasAcceptingState = states.some(s => s.isAccepting);
    if (!hasAcceptingState) {
      return false;
    }
    
    return Array.from(simulation.currentStates).some(stateId => 
      states.find(s => s.id === stateId)?.isAccepting
    );
  }, [states, simulation.currentStates]);

  // メモ化された現在の状態名リスト
  const currentStateNames = useMemo(() => {
    return Array.from(simulation.currentStates)
      .map(id => states.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [simulation.currentStates, states]);

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
                {currentStateNames || '非受理'}
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

            {(simulation.step >= simulation.input.length || simulation.currentStates.size === 0) && (
              <div className={`mt-2 p-3 rounded-lg ${
                isAccepting ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <div className={`flex items-center justify-center text-sm font-medium ${
                  isAccepting ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {isAccepting ? (
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
