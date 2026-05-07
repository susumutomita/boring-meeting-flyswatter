# 0004. Bun + Vite + React + TypeScript を採用する。

## ステータス

Accepted。

## コンテキスト

この MVP は短期間で browser interaction、game UI、audio signal、room sharing を実装し、静的に deploy できる必要がある。テストと build も単純なコマンドで通せることが重要である。

## 決定

Runtime と package manager は Bun、frontend bundler は Vite、UI は React 18、型は TypeScript を採用する。品質ゲートは Biome、`tsc --noEmit`、`bun test`、Vite build で構成する。

## 影響

- `make before-commit` で主要 gate をまとめて実行できる。
- GitHub Pages への static deploy と相性が良い。
- React hooks で browser API side effects を分離できる。
- Vite 8 / React plugin 由来の deprecation warning は watch 対象とする。

## 代替案

- Next.js は static MVP には過剰と判断した。
- Vanilla TypeScript は UI 状態と interaction の複雑さに対して保守性が落ちるため採用しない。
