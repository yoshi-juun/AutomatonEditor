import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAutomatonStore } from "../../lib/automatonStore";
import { 
  Circle,
  ArrowRight,
  Trash2,
  Move
} from "lucide-react";

export function Controls() {
  const { mode, isNFA, dispatch } = useAutomatonStore();
  const [regexInput, setRegexInput] = useState('');

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
            <RadioGroupItem value="accepting" id="accepting" />
            <Label htmlFor="accepting" className="flex items-center space-x-1">
              <Circle className="h-4 w-4" />
              <span>終了状態</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">オートマトンタイプ</h2>
          <div className="flex items-center space-x-2">
            <Switch 
              id="nfa-mode"
              checked={isNFA}
              onCheckedChange={(checked) => 
                dispatch({ type: 'SET_NFA_MODE', payload: checked })
              }
            />
            <Label htmlFor="nfa-mode">NFA モード {isNFA ? 'ON' : 'OFF'}</Label>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">アクション</h2>
          <div className="space-y-2">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="regex-input">正規表現</Label>
              <div className="flex space-x-2">
                <Input
                  id="regex-input"
                  placeholder="(a|b)*abb"
                  value={regexInput}
                  onChange={(e) => setRegexInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (regexInput) {
                      dispatch({ type: 'CONVERT_REGEX', payload: regexInput });
                    }
                  }}
                >
                  変換
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                使用可能な演算子: | (和), * (繰り返し), () (グループ化)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full"
              >
                リセット
              </Button>
              {isNFA && (
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'CONVERT_TO_DFA' })}
                  className="w-full"
                >
                  DFAに変換
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
