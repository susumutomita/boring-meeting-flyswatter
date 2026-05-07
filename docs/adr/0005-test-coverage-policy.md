# 0005. Coverage は純粋ドメインロジック中心に運用する。

## ステータス

Accepted。

## コンテキスト

`CLAUDE.md` には coverage 100% の方針があったが、現在の repository-wide coverage は 100% ではない。提出前に重要なのは、MVP の runtime が通ること、主要な domain behavior がテストで守られていること、coverage gap を隠さず記録することである。

## 決定

新規・変更する純粋ドメインロジックは TDD で主要分岐を 100% exercise する。Repository-wide coverage 100% は現時点の merge gate にはしない。`bun run test:coverage` で可視化し、未達がある場合は Plan.md / PR / AI-DLC quality assessment に理由と受容範囲を記録する。

## 影響

- 現実の CI gate と開発規律の矛盾を避けられる。
- Core logic の品質要求は維持できる。
- UI / browser API 依存部分は browser smoke test や手動確認ログで補完する。

## 代替案

- Repository-wide 100% threshold を即時導入する案は、提出直前のリスクが高いため採用しない。
- Coverage を全く見ない案は、AI-DLC の品質証跡として弱いため採用しない。
