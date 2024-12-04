import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAutomatonStore } from "../../lib/automatonStore";
import { MinimizationDialog } from "./MinimizationDialog";
import { 
  Circle,
  ArrowRight,
  Trash2,
  Move,
  HelpCircle,
  Info
} from "lucide-react";

export function Controls() {
  const { mode, isNFA, dispatch } = useAutomatonStore();
  const [regexInput, setRegexInput] = useState('');
  const [showMinimizationDialog, setShowMinimizationDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

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
          </div>
        </div>
      </div>

      <MinimizationDialog 
        isOpen={showMinimizationDialog}
        onClose={() => setShowMinimizationDialog(false)}
      />

      {/* ヘルプダイアログ */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>オートマトンエディタの使い方</DialogTitle>
            <DialogDescription>
              このエディタを使用して有限オートマトンの作成、編集、シミュレーションを行うことができます。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Circle className="h-4 w-4 mr-2" />
                状態の操作
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>状態モード（State）で空白部分をクリックして新しい状態を追加</li>
                <li>状態をダブルクリックして名前を編集</li>
                <li>終了状態モードで状態をクリックして受理/非受理状態を切り替え</li>
                <li>移動モード（Move）で状態をドラッグして位置を調整</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                遷移の操作
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>遷移モード（Transition）で始点の状態をクリック</li>
                <li>続いて終点の状態をクリックして遷移を作成</li>
                <li>遷移ラベルをクリックして入力記号を選択または編集</li>
                <li>NFAモードでは複数の入力記号をカンマ区切りで指定可能</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                高度な機能
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>正規表現からNFAを自動生成（対応演算子: |, *, (), ε）</li>
                <li>NFAからDFAへの変換（等価な決定性オートマトンを生成）</li>
                <li>DFAの最小化（冗長な状態を削除して最小のDFAを生成）</li>
                <li>JSONファイルでのインポート/エクスポート</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">シミュレーション</h3>
              <p className="text-sm">
                入力文字列を入力して実行ボタンを押すと、オートマトンがその文字列を受理するかどうかをステップバイステップで確認できます。
                各ステップで現在の状態が強調表示され、最終的に受理状態で停止すれば入力文字列は受理されます。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ヘルプボタン */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full"
        onClick={() => setShowHelpDialog(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
