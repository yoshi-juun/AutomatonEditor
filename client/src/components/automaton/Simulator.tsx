import { useState, useCallback, useMemo, memo } from 'react';
import { useAutomatonStore } from '../../lib/automatonStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, SkipForward, RotateCcw } from "lucide-react";

// 進行状況表示の最適化
const ProgressDisplay = memo(({ input, step }: { input: string; step: number }) => {
  return (
    <div className="flex items-center space-x-1 overflow-x-auto py-2">
      {input.split('').map((char, i) => (
        <div
          key={i}
          className={`
            flex-shrink-0 w-8 h-8 flex items-center justify-center rounded
            ${i === step ? 'bg-primary text-primary-foreground' :
              i < step ? 'bg-muted text-muted-foreground' :
              'border border-border'
            }
            transition-all duration-200
          `}
        >
          {char}
        </div>
      ))}
    </div>
  );
});

ProgressDisplay.displayName = 'ProgressDisplay';

export function Simulator() {
  const [inputString, setInputString] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 必要な状態のみを選択的に取得
  const alphabet = useAutomatonStore(state => state.automaton.alphabet);
  const states = useAutomatonStore(state => state.automaton.states);
  const simulation = useAutomatonStore(state => state.simulation);
  const dispatch = useAutomatonStore(state => state.dispatch);

  // メモ化された入力検証関数
  const validateInput = useCallback((input: string): boolean => {
    if (!input.trim()) return false;
    const validSymbols = Array.from(alphabet).flatMap(s => s.split(',').map(i => i.trim()));
    return input.split('').every(char => validSymbols.includes(char));
  }, [alphabet]);

  // メモ化された状態マップ
  const stateMap = useMemo(() => 
    new Map(states.map(s => [s.id, s])),
    [states]
  );

  // メモ化された受理状態セット
  const acceptingStatesSet = useMemo(() => 
    new Set(states.filter(s => s.isAccepting).map(s => s.id)),
    [states]
  );

  // メモ化された現在の状態名リスト
  const currentStateNames = useMemo(() => {
    if (!simulation.currentStates.size) return '';
    return Array.from(simulation.currentStates)
      .map(id => stateMap.get(id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [simulation.currentStates, stateMap]);

  // メモ化された受理状態チェック
  const isAccepting = useMemo(() => {
    if (!simulation.isRunning || !simulation.currentStates.size) return false;
    return Array.from(simulation.currentStates).some(id => acceptingStatesSet.has(id));
  }, [simulation.currentStates, acceptingStatesSet, simulation.isRunning]);

  // 入力ハンドラー
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInputString(newInput);
    setError(null);
  }, []);

  // シミュレーション開始
  const handleStart = useCallback(() => {
    if (!inputString.trim()) {
      setError('入力文字列を入力してください');
      return;
    }

    if (!validateInput(inputString)) {
      const validSymbols = Array.from(alphabet).flatMap(s => s.split(',').map(i => i.trim()));
      setError(`無効な入力記号が含まれています。使用可能な記号：${validSymbols.join(', ')}`);
      return;
    }

    dispatch({ type: 'START_SIMULATION', payload: inputString.trim() });
  }, [inputString, alphabet, dispatch, validateInput]);

  // シミュレーションステップ実行の最適化
  const handleStep = useCallback(() => {
    if (!simulation.isRunning || simulation.step >= simulation.input.length) return;
    dispatch({ type: 'STEP_SIMULATION' });
  }, [simulation.isRunning, simulation.step, simulation.input.length, dispatch]);

  // シミュレーション停止
  const handleStop = useCallback(() => {
    dispatch({ type: 'STOP_SIMULATION' });
    setInputString('');
    setError(null);
  }, [dispatch]);

  // メモ化されたシミュレーション状態表示
  const SimulationStatus = useMemo(() => {
    if (!simulation.isRunning) return null;
    return (
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
      </div>
    );
  }, [simulation.isRunning, simulation.step, simulation.input, currentStateNames]);

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
            disabled={!inputString.trim()}
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
          
          {SimulationStatus}

          {simulation.input && (
            <ProgressDisplay input={simulation.input} step={simulation.step} />
          )}

          {(simulation.step >= simulation.input.length || simulation.currentStates.size === 0) && (
            <div 
              className={`mt-2 p-4 rounded-lg transition-all duration-300 ${
                isAccepting 
                  ? 'bg-green-100 dark:bg-green-900/20 shadow-[0_0_15px_rgba(0,255,0,0.1)]' 
                  : 'bg-red-100 dark:bg-red-900/20 shadow-[0_0_15px_rgba(255,0,0,0.1)]'
              } border ${
                isAccepting 
                  ? 'border-green-200 dark:border-green-800' 
                  : 'border-red-200 dark:border-red-800'
              }`}
            >
              <div 
                className={`flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                  isAccepting ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {isAccepting ? (
                  <>✓ 入力文字列は受理されました</>
                ) : (
                  <>✕ 入力文字列は受理されませんでした</>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
