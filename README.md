# 暖木五子棋 Gomoku

這是一個不需後端、以 HTML、CSS、原生 JavaScript 與 Canvas 製作的 15 × 15 五子棋遊戲，支援本機雙人及玩家對電腦。

## 遊戲規則

- 黑棋先手，雙方輪流落子。
- 水平、垂直或任一斜向率先連成五顆或以上即獲勝。
- 棋盤下滿且無人獲勝則為和局。
- 目前採簡化規則，沒有禁手規則。

## 遊戲模式

- **雙人本機對戰**：黑白雙方共用同一部裝置；悔棋撤回最後一手。
- **玩家對電腦**：玩家執黑先手、電腦執白；悔棋一次撤回玩家和電腦最近的一回合。

## 檔案結構

```text
gomoku-game/
├── assets/music/hes-a-pirate.mid
├── assets/music/hes-a-pirate.wav
├── index.html       # 頁面結構與控制介面
├── style.css        # 響應式與木質視覺設計
├── game.js          # 規則、狀態、Canvas 與操作
├── ai.js            # 電腦評分與選點邏輯
├── tests.html       # 瀏覽器測試入口
├── tests.js         # 純邏輯測試案例
└── README.md
```

## 如何執行

可直接以 Chrome 或 Edge 開啟 `index.html`。建議使用本機伺服器：

```bash
cd /home/jason/codex-family-demo/gomoku-game
python3 -m http.server 8000
```

再瀏覽 `http://localhost:8000`。

## 如何執行測試

啟動上述伺服器後瀏覽 `http://localhost:8000/tests.html`。頁面會自動測試四種勝線、六子連線，以及 AI 的立即獲勝與阻擋決策，不需額外測試框架。

## AI 決策邏輯

AI 只評估既有棋子兩格範圍內的候選點，以保持流暢。它會先尋找自己的立即勝著，再阻擋玩家的立即勝著；其餘位置依活四、眠四、活三、眠三、活二等棋形計分，同時計入進攻、對手威脅及中央位置偏好。評分表集中在 `ai.js` 的 `shapeScore`，方便日後調整。

## 背景音樂

原始 MIDI 保留於 `assets/music/hes-a-pirate.mid`，並已在本機合成為 Chrome、Edge 可播放的 `assets/music/hes-a-pirate.wav`。介面不會自動播放，需由玩家按下「播放音樂」，播放完畢後會自動循環。

## 已知限制

- 目前沒有禁手規則。
- AI 著重快速、可理解的局部評估，不具專業棋力。
- WAV 使用簡潔的本機合成音色，不是錄音室原版樂器音色。
