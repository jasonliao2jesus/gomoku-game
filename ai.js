(function (global) {
  'use strict';

  const EMPTY = 0;
  const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function inBounds(board, row, col) {
    return row >= 0 && row < board.length && col >= 0 && col < board.length;
  }

  function wouldWin(board, row, col, player) {
    if (board[row][col] !== EMPTY) return false;
    board[row][col] = player;
    const won = DIRECTIONS.some(([dr, dc]) => {
      let count = 1;
      for (const sign of [-1, 1]) {
        let r = row + dr * sign;
        let c = col + dc * sign;
        while (inBounds(board, r, c) && board[r][c] === player) {
          count++; r += dr * sign; c += dc * sign;
        }
      }
      return count >= 5;
    });
    board[row][col] = EMPTY;
    return won;
  }

  // 評估落子後單一方向的連子數及兩端是否仍可延伸。
  function directionShape(board, row, col, player, dr, dc) {
    let length = 1;
    let openEnds = 0;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (inBounds(board, r, c) && board[r][c] === player) {
        length++; r += dr * sign; c += dc * sign;
      }
      if (inBounds(board, r, c) && board[r][c] === EMPTY) openEnds++;
    }
    return { length, openEnds };
  }

  // 分數表刻意集中在此，日後可直接調整 AI 的攻守風格。
  function shapeScore(length, openEnds) {
    if (length >= 5) return 1_000_000;
    if (length === 4 && openEnds === 2) return 100_000; // 活四
    if (length === 4 && openEnds === 1) return 20_000;  // 眠四
    if (length === 3 && openEnds === 2) return 8_000;   // 活三
    if (length === 3 && openEnds === 1) return 1_200;   // 眠三
    if (length === 2 && openEnds === 2) return 500;     // 活二
    if (length === 2 && openEnds === 1) return 80;
    return openEnds === 2 ? 12 : 2;
  }

  function evaluateMove(board, row, col, player) {
    if (board[row][col] !== EMPTY) return -Infinity;
    board[row][col] = player;
    let total = 0;
    let strongDirections = 0;
    for (const [dr, dc] of DIRECTIONS) {
      const shape = directionShape(board, row, col, player, dr, dc);
      total += shapeScore(shape.length, shape.openEnds);
      if (shape.length >= 3 && shape.openEnds > 0) strongDirections++;
    }
    board[row][col] = EMPTY;
    // 雙向威脅通常比單一棋形更難防守。
    if (strongDirections >= 2) total += 12_000;
    return total;
  }

  function nearbyCandidates(board) {
    const size = board.length;
    const occupied = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (board[r][c] !== EMPTY) occupied.push([r, c]);
    }
    if (!occupied.length) return [[Math.floor(size / 2), Math.floor(size / 2)]];

    const candidates = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (board[r][c] !== EMPTY) continue;
      if (occupied.some(([or, oc]) => Math.max(Math.abs(or - r), Math.abs(oc - c)) <= 2)) {
        candidates.push([r, c]);
      }
    }
    return candidates;
  }

  function chooseMove(board, aiPlayer, humanPlayer) {
    const candidates = nearbyCandidates(board);
    if (!candidates.length) return null;

    // 第一優先：立即取勝；第二優先：擋住對手立即取勝。
    const winning = candidates.find(([r, c]) => wouldWin(board, r, c, aiPlayer));
    if (winning) return winning;
    const blocking = candidates.find(([r, c]) => wouldWin(board, r, c, humanPlayer));
    if (blocking) return blocking;

    const center = (board.length - 1) / 2;
    let best = null;
    let bestScore = -Infinity;
    for (const [row, col] of candidates) {
      const attack = evaluateMove(board, row, col, aiPlayer);
      const defense = evaluateMove(board, row, col, humanPlayer);
      const centerBias = board.length - (Math.abs(row - center) + Math.abs(col - center));
      const score = attack + defense * 1.12 + centerBias;
      if (score > bestScore) {
        bestScore = score;
        best = [row, col];
      }
    }
    return best;
  }

  global.GomokuAI = { chooseMove, evaluateMove, wouldWin };
})(typeof window !== 'undefined' ? window : globalThis);
