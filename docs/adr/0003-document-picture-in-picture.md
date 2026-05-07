# 0003. Document Picture-in-Picture を optional enhancement として採用する。

## ステータス

Accepted。

## コンテキスト

会議中は参加者が別タブや会議画面を見ている可能性が高い。退屈メーターを小窓として常時表示できると、会議中の companion app としての体験が強くなる。ただし Document Picture-in-Picture は Chromium 系に限定される。

## 決定

Document Picture-in-Picture は optional enhancement として採用する。未対応ブラウザでは in-tab 表示に fallback し、機能不備として扱わない。

## 影響

- Chromium 系では小窓メーターを提供できる。
- Safari / Firefox では fallback する。
- `useDocumentPip` で browser API 依存を局所化する。

## 代替案

- 常時 in-tab のみとする案は、会議 companion 感が弱いため採用しない。
- 独自 popup window は browser blocker や UX の不安定さがあるため採用しない。
