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
      setError('Please enter an input string');
      return;
    }

    if (!validateInput(inputString)) {
      setError('Input contains invalid symbols');
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
          <div className="text-sm">
            Current states: {Array.from(simulation.currentStates).map(id => {
              const state = automaton.states.find(s => s.id === id);
              return state?.name;
            }).join(', ') || 'None'}
          </div>
          <div className={`text-sm font-medium ${
            simulation.step >= simulation.input.length
              ? (isAccepting() ? 'text-green-600' : 'text-red-600')
              : ''
          }`}>
            {getSimulationStatus()}
          </div>
        </div>
      )}
    </div>
  );
}
