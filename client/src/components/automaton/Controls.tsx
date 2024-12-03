import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAutomatonStore } from "../../lib/automatonStore";
import { 
  Circle,
  ArrowRight,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Move
} from "lucide-react";

export function Controls() {
  const { mode, automaton, dispatch } = useAutomatonStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Mode</h2>
        <RadioGroup
          value={mode}
          onValueChange={(value) => dispatch({ type: 'SET_MODE', payload: value as any })}
          className="grid grid-cols-2 gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="state" id="state" />
            <Label htmlFor="state" className="flex items-center space-x-1">
              <Circle className="h-4 w-4" />
              <span>State</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="transition" id="transition" />
            <Label htmlFor="transition" className="flex items-center space-x-1">
              <ArrowRight className="h-4 w-4" />
              <span>Transition</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="delete" id="delete" />
            <Label htmlFor="delete" className="flex items-center space-x-1">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="drag" id="drag" />
            <Label htmlFor="drag" className="flex items-center space-x-1">
              <Move className="h-4 w-4" />
              <span>Move</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="simulate" id="simulate" />
            <Label htmlFor="simulate" className="flex items-center space-x-1">
              <Play className="h-4 w-4" />
              <span>Simulate</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Reset to initial state
              window.location.reload();
            }}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: 'TOGGLE_AUTOMATON_TYPE' });
            }}
            className="w-full"
          >
            {automaton.type === 'DFA' ? 'Switch to NFA' : 'Switch to DFA'}
          </Button>
          {automaton.type === 'NFA' && (
            <Button
              variant="outline"
              onClick={() => {
                dispatch({ type: 'CONVERT_TO_DFA' });
              }}
              className="w-full"
            >
              Convert to DFA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
