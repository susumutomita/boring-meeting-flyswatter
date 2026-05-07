# 0001. Browser-only static MVP を採用する。

## ステータス

Accepted。

## コンテキスト

Boring Meeting Flyswatter はハッカソン提出向けの MVP であり、最初の価値は「会議の沈黙を検知し、短いハエ叩き介入と振り返りへ変換する体験」をブラウザで示すことである。アカウント、録音、バックエンド永続化は、提出時点では価値検証より運用負荷が大きい。

## 決定

提出版 MVP は Browser-only static app として実装し、Vite build を GitHub Pages に配信する。カスタム backend は導入しない。

## 影響

- GitHub Pages だけで公開できる。
- アカウントやサーバー運用なしで demo できる。
- 音声はローカルの activity signal として扱い、録音や transcription を行わない。
- 永続的な会議履歴や自己ホスト signaling は future work とする。

## 代替案

- Hono backend を追加する案もあったが、MVP の価値検証には不要と判断した。
- 永続 DB を追加する案もあったが、プライバシーリスクと運用負荷が上がるため採用しない。
