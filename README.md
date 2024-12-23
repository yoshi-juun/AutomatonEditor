# オートマトンエディタ

教育目的のWebベースオートマトンエディター。グラフィカルインターフェースを通じて決定性有限オートマトン（DFA）および非決定性有限オートマトン（NFA）の作成、編集、シミュレーションが可能。NFAからDFAへの変換機能、正規表現からNFAへの変換機能、およびDFA最小化機能を実装。

## 機能

- 状態とトランジションの追加・編集・削除
- 複数入力値のカンマ区切り入力
- 重複遷移の自動防止
- シミュレーション実行
- オートマトンの自動レイアウト
- JSONファイルによるインポート/エクスポート
- NFAからDFAへの変換
- 正規表現からNFAへの変換（ε遷移対応）
- DFA最小化アルゴリズムの実行と視覚化

## 技術スタック

- React (useEffect, useCallback)
- コンポーネントベースアーキテクチャ
- JSONデータ構造

## Docker での起動方法

このアプリケーションは Docker を使用して実行することができます。

### 前提条件
- Docker
- Docker Compose

### 初回起動手順

1. リポジトリをクローン：
```bash
git clone https://github.com/yoshi-juun/AutomatonEditor.git
cd AutomatonEditor
```

2. Docker コンテナのビルドと起動：
```bash
docker-compose up --build
```

3. アプリケーションへのアクセス：
ブラウザで http://localhost:5001 を開いてください。

### 終了手順
`Control+C`で終了

### ２回目以降起動手順
```bash
docker-compose up
```
---

## ポート競合が発生した際の対処法

Docker Compose 実行時にポート競合 (`Ports are not available` エラー) が発生する場合、以下の手順で対処してください。

### 1. 使用中のポートを確認
現在使用中のポートを確認するには、以下のコマンドを実行します：

```bash
lsof -i :<ポート番号>
```

例: ポート5001を確認する場合
```bash
lsof -i :5001
```

表示例:
```plaintext
COMMAND    PID         USER   FD   TYPE            DEVICE SIZE/OFF NODE NAME
ControlCe  1008  sampleUser   10u  IPv4 0x...      0t0  TCP *:5001 (LISTEN)
```

この結果からポート5001を使用しているプロセス (例: `ControlCe`) を特定できます。

---

### 2. プロセスを停止
ポートを解放するには、対象プロセスを停止します。

```bash
kill -9 <PID>
```

例: `ControlCe`のPIDが`1008`の場合
```bash
kill -9 1008
```

---

### 3. アプリケーションのポートを変更
ポート競合を防ぐために、ホスト側のポートを変更することもできます。

#### `docker-compose.yml`の編集
```yaml
ports:
  - "<新しいポート番号>:5000"
```

例: ポート5001を使用する場合
```yaml
ports:
  - "5001:5000"
```

変更後に以下を実行してください：
```bash
docker-compose down
docker-compose up --build
```

変更後、ブラウザで以下のURLにアクセスします：
```
http://localhost:<新しいポート番号>
```

---

### 4. 一括停止でポートを解放
すべてのDockerコンテナを停止して解放するには、以下を実行します：  
また、アプリケーションを使い終わり無駄に動かしておきたくない人もこちらを実行

```bash
docker stop $(docker ps -q)
```

---

### 5. 使用中のポートを特定できない場合
`lsof`で特定できない場合、システムの他のサービスやアプリケーションがポートを使用している可能性があります。以下を試してください：

- サービスの再起動
```bash
sudo service docker restart
```

- システムの再起動

---

これでポート競合の問題を解決できます。適切にポートを変更または解放して再実行してください。
