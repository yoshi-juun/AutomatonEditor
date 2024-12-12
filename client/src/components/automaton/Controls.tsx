import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useAutomatonStore } from "../../lib/automatonStore";
import { MinimizationDialog } from "./MinimizationDialog";
import { HelpDialog } from "./HelpDialog";
import { 
  Circle,
  ArrowRight,
  Trash2,
  Move,
  HelpCircle
} from "lucide-react";

export function Controls() {
  const { mode, isNFA, dispatch } = useAutomatonStore();
  const [regexInput, setRegexInput] = useState('');
  const [showMinimizationDialog, setShowMinimizationDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] pr-4">
      <div className="space-y-6">
        <div className="space-y-2">
        <h2 className="text-lg font-semibold">Mode</h2>
        <RadioGroup
          value={mode}
          onValueChange={(value) => dispatch({ type: 'SET_MODE', payload: value as any })}
          className="grid grid-cols-2 gap-2"
        >
          <div className="relative">
            <RadioGroupItem
              value="state"
              id="state"
              className="peer sr-only"
            />
            <Label
              htmlFor="state"
              className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
              <Circle className="h-4 w-4" />
              <span>State</span>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="transition"
              id="transition"
              className="peer sr-only"
            />
            <Label
              htmlFor="transition"
              className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Transition</span>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="delete"
              id="delete"
              className="peer sr-only"
            />
            <Label
              htmlFor="delete"
              className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="drag"
              id="drag"
              className="peer sr-only"
            />
            <Label
              htmlFor="drag"
              className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
              <Move className="h-4 w-4" />
              <span>Move</span>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="accepting"
              id="accepting"
              className="peer sr-only"
            />
            <Label
              htmlFor="accepting"
              className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
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
                使用可能な演算子: | (和), * (繰り返し), () (グループ化), ε (空文字)
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">インポート/エクスポート</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.json';
                    fileInput.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      
                      const text = await file.text();
                      dispatch({ type: 'IMPORT_AUTOMATON', payload: { format: 'json', content: text } });
                    };
                    fileInput.click();
                  }}
                  className="w-full"
                >
                  インポート
                </Button>
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'EXPORT_AUTOMATON' })}
                  className="w-full"
                >
                  エクスポート
                </Button>
              </div>
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
              {!isNFA && (
                <Button
                  variant="outline"
                  onClick={() => setShowMinimizationDialog(true)}
                  className="w-full"
                >
                  DFAを最小化
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowHelpDialog(true)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <HelpCircle className="h-4 w-4" />
              <span>ヘルプ</span>
            </Button>
          </div>
        </div>
      </div>

      <MinimizationDialog 
        isOpen={showMinimizationDialog}
        onClose={() => setShowMinimizationDialog(false)}
      />
      
      <HelpDialog
        isOpen={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
      />
    </div>
    </ScrollArea>
  );
}
