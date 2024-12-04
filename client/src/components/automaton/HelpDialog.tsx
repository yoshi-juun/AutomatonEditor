import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Circle, ArrowRight, Trash2, Move } from "lucide-react";

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>オートマトンエディタ ヘルプ</DialogTitle>
          <DialogDescription>
            基本的な操作方法と機能の説明
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">基本操作</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Circle className="h-4 w-4" />
                  <span>状態の追加: 「State」モードで空白部分をクリック</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>遷移の追加: 「Transition」モードで始点と終点の状態をクリック</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>削除: 「Delete」モードで状態または遷移をクリック</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Move className="h-4 w-4" />
                  <span>移動: 「Move」モードで状態をドラッグ</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">状態の編集</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>状態名の変更: 状態をダブルクリック</li>
                <li>終了状態の設定: 「終了状態」モードで状態をクリック</li>
                <li>初期状態は自動的に最初に作成した状態になります</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">遷移の編集</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>遷移の入力値変更: 遷移ラベルをクリックして選択または新規入力</li>
                <li>NFAモード: カンマ区切りで複数の入力値を設定可能</li>
                <li>ε遷移: NFAモードでεを選択</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">高度な機能</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>正規表現からNFAへの変換: 正規表現を入力して「変換」をクリック</li>
                <li>NFAからDFAへの変換: NFAモードで「DFAに変換」をクリック</li>
                <li>DFAの最小化: DFAモードで「DFAを最小化」をクリック</li>
                <li>オートマトンの保存/読み込み: JSON形式でインポート/エクスポート</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">シミュレーション</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>入力文字列を入力し「Start」をクリック</li>
                <li>「Step」ボタンで1文字ずつ実行</li>
                <li>現在の状態が緑色でハイライト</li>
                <li>最終的な受理/非受理状態を表示</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={onClose}>閉じる</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
