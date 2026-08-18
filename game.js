(function (global) {
  'use strict';

  const SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function createBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  }

  function findWinningLine(board, row, col, player) {
    for (const [dr, dc] of DIRECTIONS) {
      const line = [[row, col]];
      for (const sign of [-1, 1]) {
        const side = [];
        let r = row + dr * sign;
        let c = col + dc * sign;
        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
          side.push([r, c]); r += dr * sign; c += dc * sign;
        }
        if (sign < 0) line.unshift(...side.reverse()); else line.push(...side);
      }
      if (line.length >= 5) return line;
    }
    return null;
  }

  // 純邏輯 API 供瀏覽器測試頁使用。
  global.GomokuCore = { SIZE, EMPTY, BLACK, WHITE, createBoard, findWinningLine };

  if (typeof document === 'undefined') return;
  // tests.html 只載入純邏輯 API，沒有遊戲棋盤元素。
  if (!document.getElementById('board')) return;

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('status');
  const players = document.getElementById('players');
  const moveCount = document.getElementById('moveCount');
  const turnStone = document.getElementById('turnStone');
  const undoButton = document.getElementById('undoButton');
  const music = document.getElementById('music');
  const musicButton = document.getElementById('musicButton');
  const musicMessage = document.getElementById('musicMessage');

  let board;
  let mode;
  let currentPlayer;
  let history;
  let gameOver;
  let winningLine;
  let thinking;
  let focusCell;
  let aiTimer = null;
  let gameToken = 0;
  let newestMove = null;

  function restartGame() {
    gameToken++;
    clearTimeout(aiTimer);
    board = createBoard();
    mode = document.querySelector('input[name="mode"]:checked').value;
    currentPlayer = BLACK;
    history = [];
    gameOver = false;
    winningLine = null;
    thinking = false;
    newestMove = null;
    focusCell = { row: 7, col: 7 };
    players.textContent = mode === 'ai' ? '你：黑棋　電腦：白棋' : '玩家一：黑棋　玩家二：白棋';
    updateUI();
    drawBoard();
  }

  function placeStone(row, col, player) {
    if (gameOver || thinking || board[row][col] !== EMPTY || player !== currentPlayer) return false;
    board[row][col] = player;
    history.push({ row, col, player });
    newestMove = { row, col };
    winningLine = findWinningLine(board, row, col, player);

    if (winningLine) {
      gameOver = true;
    } else if (history.length === SIZE * SIZE) {
      gameOver = true;
    } else {
      currentPlayer = player === BLACK ? WHITE : BLACK;
    }
    updateUI();
    drawBoard();
    return true;
  }

  function humanMove(row, col) {
    if (mode === 'ai' && currentPlayer !== BLACK) return;
    if (!placeStone(row, col, currentPlayer)) return;
    if (mode === 'ai' && !gameOver) scheduleAI();
  }

  function scheduleAI() {
    thinking = true;
    const token = gameToken;
    updateUI();
    aiTimer = setTimeout(() => {
      if (token !== gameToken || gameOver) return;
      thinking = false;
      const move = global.GomokuAI.chooseMove(board, WHITE, BLACK);
      if (move) placeStone(move[0], move[1], WHITE);
    }, 360);
  }

  function undo() {
    if (!history.length || thinking) return;
    gameToken++;
    gameOver = false;
    winningLine = null;
    const removeCount = mode === 'ai' ? Math.min(2, history.length) : 1;
    for (let i = 0; i < removeCount; i++) {
      const move = history.pop();
      board[move.row][move.col] = EMPTY;
    }
    currentPlayer = mode === 'ai' ? BLACK : (history.length % 2 === 0 ? BLACK : WHITE);
    newestMove = history.length ? history[history.length - 1] : null;
    updateUI();
    drawBoard();
  }

  function updateUI() {
    let text;
    if (winningLine) text = `${currentPlayer === BLACK ? '黑棋' : '白棋'}獲勝！`;
    else if (gameOver) text = '和局，棋盤已下滿';
    else if (thinking) text = '電腦思考中…';
    else text = `${currentPlayer === BLACK ? '黑棋' : '白棋'}回合`;
    status.textContent = text;
    turnStone.className = `turn-stone ${currentPlayer === BLACK ? 'black' : 'white'}`;
    moveCount.textContent = `已下 ${history.length} 手`;
    undoButton.disabled = !history.length || thinking;
    canvas.setAttribute('aria-disabled', String(gameOver || thinking));
  }

  function geometry() {
    const padding = 37.5;
    return { padding, gap: (canvas.width - padding * 2) / (SIZE - 1) };
  }

  function drawBoard() {
    const { padding, gap } = geometry();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const wood = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    wood.addColorStop(0, '#e1b66e'); wood.addColorStop(.5, '#d3a158'); wood.addColorStop(1, '#c58c45');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#5e3d20';
    ctx.lineWidth = 2;
    for (let i = 0; i < SIZE; i++) {
      const p = padding + i * gap;
      ctx.beginPath(); ctx.moveTo(padding, p); ctx.lineTo(canvas.width - padding, p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p, padding); ctx.lineTo(p, canvas.height - padding); ctx.stroke();
    }
    ctx.fillStyle = '#553419';
    [[3,3], [3,11], [7,7], [11,3], [11,11]].forEach(([r,c]) => {
      ctx.beginPath(); ctx.arc(padding + c * gap, padding + r * gap, 5, 0, Math.PI * 2); ctx.fill();
    });

    board.forEach((row, r) => row.forEach((player, c) => {
      if (player) drawStone(r, c, player, gap);
    }));

    if (newestMove) {
      const x = padding + newestMove.col * gap;
      const y = padding + newestMove.row * gap;
      ctx.strokeStyle = board[newestMove.row][newestMove.col] === BLACK ? '#fff6e8' : '#a83c2d';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 6, y - 6, 12, 12);
    }

    if (winningLine) {
      const first = winningLine[0];
      const last = winningLine[winningLine.length - 1];
      ctx.strokeStyle = '#d82929'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(padding + first[1] * gap, padding + first[0] * gap);
      ctx.lineTo(padding + last[1] * gap, padding + last[0] * gap);
      ctx.stroke();
    }

    if (document.activeElement === canvas && !gameOver) {
      const x = padding + focusCell.col * gap;
      const y = padding + focusCell.row * gap;
      ctx.strokeStyle = '#096fd1'; ctx.lineWidth = 4;
      ctx.strokeRect(x - gap * .42, y - gap * .42, gap * .84, gap * .84);
    }
  }

  function drawStone(row, col, player, gap) {
    const { padding } = geometry();
    const x = padding + col * gap;
    const y = padding + row * gap;
    const radius = gap * .42;
    ctx.save();
    ctx.shadowColor = '#0007'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 3;
    const gradient = ctx.createRadialGradient(x - radius * .35, y - radius * .4, 2, x, y, radius);
    if (player === BLACK) { gradient.addColorStop(0, '#5d5a55'); gradient.addColorStop(.55, '#191817'); gradient.addColorStop(1, '#030303'); }
    else { gradient.addColorStop(0, '#fff'); gradient.addColorStop(.65, '#eee9df'); gradient.addColorStop(1, '#bcb3a7'); }
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function canvasPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { padding, gap } = geometry();
    const col = Math.round((event.clientX - rect.left) * scaleX / gap - padding / gap);
    const row = Math.round((event.clientY - rect.top) * scaleY / gap - padding / gap);
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return null;
    return { row, col };
  }

  canvas.addEventListener('click', event => {
    const point = canvasPosition(event);
    if (point) { focusCell = point; humanMove(point.row, point.col); }
  });
  canvas.addEventListener('focus', drawBoard);
  canvas.addEventListener('blur', drawBoard);
  canvas.addEventListener('keydown', event => {
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[event.key]) {
      event.preventDefault();
      focusCell.row = Math.max(0, Math.min(SIZE - 1, focusCell.row + moves[event.key][0]));
      focusCell.col = Math.max(0, Math.min(SIZE - 1, focusCell.col + moves[event.key][1]));
      drawBoard();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); humanMove(focusCell.row, focusCell.col);
    }
  });

  document.getElementById('restartButton').addEventListener('click', restartGame);
  undoButton.addEventListener('click', undo);
  document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', restartGame));
  musicButton.addEventListener('click', async () => {
    if (!music.paused) {
      music.pause();
      musicButton.textContent = '播放音樂'; musicButton.setAttribute('aria-pressed', 'false');
      musicMessage.textContent = '音樂已暫停。';
      return;
    }
    try {
      await music.play();
      musicButton.textContent = '暫停音樂'; musicButton.setAttribute('aria-pressed', 'true');
      musicMessage.textContent = '正在播放背景音樂。';
    } catch (error) {
      musicMessage.textContent = '瀏覽器未能播放音訊；請確認音量與檔案存取權限。';
    }
  });
  music.addEventListener('error', () => {
    musicMessage.textContent = '找不到音訊檔；遊戲仍可正常進行。';
  });

  restartGame();
})(typeof window !== 'undefined' ? window : globalThis);
