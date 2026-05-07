# Browser Smoke Test Checklist

## 目的

提出前に、Boring Meeting Flyswatter の live demo がブラウザで最低限の体験を提供できることを確認する。

## 対象 URL

- Live demo: https://susumutomita.github.io/boring-meeting-flyswatter/
- Local dev server: http://localhost:5173/

## 手順

1. ページを開く。
2. 初期画面が表示されることを確認する。
3. `Start meeting` または対応する開始ボタンを押す。
4. マイク許可の有無にかかわらず、画面が破綻しないことを確認する。
5. 60 秒経過または state 操作で swatting phase に入り、armed overlay が表示されることを確認する。
6. 15 秒の swatting round を開始する。
7. ハエ、フラペチーノ、黄金のハチが表示されることを確認する。
8. ハエを叩くと score が増えることを確認する。
9. ミーティングを終了し、summary が表示されることを確認する。
10. 理由 preset と productivity score が入力できることを確認する。

## 合格条件

- ページが HTTP 200 で到達できる。
- JavaScript fatal error で真っ白にならない。
- Start meeting から summary までの主要導線が成立する。
- README の提出版仕様と画面表示が矛盾しない。
