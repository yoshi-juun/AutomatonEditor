# Nodeベースイメージの使用
FROM node:latest

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonのコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードのコピー
COPY . .

# ポート5000を公開
EXPOSE 5000

# アプリケーションの起動
CMD ["npm", "run", "dev"]
