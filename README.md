# Boring Meeting Flyswatter ( BMF )

退屈な会議をブラウザだけで観測し、沈黙が続いたらハエ叩きで 1 回だけ介入してくれる実験プロダクト。退屈ポイントの初出時刻を記録し、終了時に「なぜ退屈だったか」を集計する。

[https://susumutomita.github.io/boring-meeting-flyswatter/](https://susumutomita.github.io/boring-meeting-flyswatter/)

## なにをするもの

- ` ミーティング開始 ` を押した瞬間から、無操作 / 無発話の時間を退屈度メーターとして可視化する。
- 一定時間沈黙が続いたら 1 ミーティング 1 回だけハエ叩きミニゲームが発火し、その時刻を ` 初回退屈秒 ` として記録する。
- 終了時に、ミーティング長 / 合計沈黙 / 退屈率 / ハエ叩き結果 / 選んだ退屈の理由 / 名言を振り返りパネルにまとめる。
- ルームコードで同じ会議に参加した人とスコア・退屈の理由を WebRTC で共有できる ( 任意 ) 。
- 会議画面を邪魔しないため、退屈メーターは Document Picture-in-Picture の小窓で常駐できる ( Chromium 系のみ ) 。

## 退屈の検知ソース

| ソース | 取得方法 | 範囲 | 備考 |
| --- | --- | --- | --- |
| キーボード / ポインター / フォーカス | window listener | 自分の操作 | デフォルトでオン |
| タブ音声 | ` getDisplayMedia({ audio: true }) ` | ブラウザ会議の全員 | ブラウザの共有ダイアログで「タブの音声も共有」ON |
| マイク | ` getUserMedia({ audio: true }) ` | 自分の発話 | タブ共有が刺さらない環境のフォールバック |

退屈の理由はプリセットからの選択のみで、自由入力は受け付けない。漏洩しても会議特定情報にならない設計。

## ツールスタック

| 用途 | ツール |
| --- | --- |
| ランタイム / パッケージマネージャ | Bun |
| フロントエンド | Vite + React + TypeScript |
| 通信 | WebRTC ( PeerJS の公開ブローカ経由 ) |
| リンター / フォーマッター | Biome |
| テスト | bun test ( BDD スタイル、日本語タイトル ) |
| Git フック | Husky + lint-staged |
| デプロイ | GitHub Pages ( Actions 経由 ) |

## セットアップ

```bash
bun install
bun run dev   # http://localhost:5173/
```

## コマンド

```bash
make install        # 依存をインストール
make dev            # 開発モード
make lint           # biome check
make format         # biome format
make typecheck      # tsc --noEmit
make test           # bun test
make build          # production build
make before-commit  # lint + typecheck + test + build を一括
```

## ディレクトリ構成

```
.
├── .claude/
│   ├── settings.json
│   ├── scripts/
│   └── skills/
├── .github/workflows/
│   ├── ci.yml             # lint / typecheck / test / build
│   └── pages.yml          # GitHub Pages へのデプロイ
├── docs/
│   └── specs/             # 仕様メモ
├── packages/
│   └── frontend/
│       ├── src/
│       │   ├── components/    # SwatterArena / MeetingHud / MeetingSummary / RoomConnect / ScoreLeaderboard / ReasonAggregate / ReasonPicker / PipMeter
│       │   ├── hooks/         # useSwatter / useMeetingTick / useActivityTracking / useTabAudioActivity / useMicrophoneActivity / useStreamSpeechDetector / useDocumentPip / useScoreShare
│       │   └── lib/           # meeting / scoreShare / audio / quotes ( 純粋関数 + テスト )
│       └── ...
├── biome.json
├── CLAUDE.md
├── Plan.md                # セッションごとの目的 / タスク / 振り返りログ ( 不変 )
└── Makefile
```

## 開発ガイドライン

[CLAUDE.md](./CLAUDE.md) を参照。テストは BDD スタイルで日本語タイトル、` toggleBoredomReason ` などのドメインロジックは ` lib/ ` 配下の純粋関数として TDD で実装する。

## 既知の制約

- Document Picture-in-Picture は Chromium 系 ( Chrome / Edge / Arc 等 ) のみ。Safari / Firefox はタブ内表示にフォールバック。
- Zoom / Teams / Google Meet のデスクトップアプリ音声は OS レベルの音声共有が必要なため対象外。ブラウザ版を開いてタブ共有してもらう前提。
- ` PeerJS ` の公開ブローカを利用するため、ルームコードを推測されると同じ会議に第三者が参加できる。共有内容は WebRTC ( DTLS ) で暗号化されているがブローカに到達ログが残る。LAN-only モードは別途検討中。
