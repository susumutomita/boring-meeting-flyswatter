# 0002. PeerJS で room sharing を実装する。

## ステータス

Accepted。

## コンテキスト

MVP では、参加者同士が score、退屈理由、主観評価を同じ room 内で共有できる必要がある。一方で、提出版では独自 signaling server の実装・運用を避けたい。

## 決定

PeerJS を使い、room code から決定的な host peer ID を作る。最初の参加者が host になり、後続参加者は host に接続する。共有 payload は `ScoreSnapshot` に限定する。

## 影響

- 独自 backend なしで WebRTC Data Channel を使える。
- PeerJS public broker に availability と metadata exposure の依存が残る。
- 共有するデータは score、phase、preset reason、productivity score などの構造化データに限定できる。

## 代替案

- 独自 Hono signaling server は roadmap とする。
- BroadcastChannel は同一ブラウザ内に閉じるため、複数参加者 room には不適切と判断した。
