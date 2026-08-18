(function () {
  'use strict';
  const C = window.GomokuCore;
  const tests = [];
  function test(name, fn) { tests.push({ name, fn }); }
  function assert(value, message) { if (!value) throw new Error(message || '斷言失敗'); }
  function lineTest(name, coordinates, last) {
    test(name, () => {
      const board = C.createBoard();
      coordinates.forEach(([r, c]) => { board[r][c] = C.BLACK; });
      assert(C.findWinningLine(board, last[0], last[1], C.BLACK).length >= 5);
    });
  }
  lineTest('水平五子', [[7,3],[7,4],[7,5],[7,6],[7,7]], [7,7]);
  lineTest('垂直五子', [[2,8],[3,8],[4,8],[5,8],[6,8]], [6,8]);
  lineTest('左上至右下五子', [[2,2],[3,3],[4,4],[5,5],[6,6]], [6,6]);
  lineTest('右上至左下五子', [[2,8],[3,7],[4,6],[5,5],[6,4]], [6,4]);
  lineTest('六子以上仍獲勝', [[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]], [7,7]);
  test('AI 完成立即勝利', () => {
    const b = C.createBoard(); [3,4,5,6].forEach(c => { b[7][c] = C.WHITE; });
    const [r,c] = window.GomokuAI.chooseMove(b, C.WHITE, C.BLACK);
    assert(r === 7 && (c === 2 || c === 7), `收到 ${r},${c}`);
  });
  test('AI 阻擋玩家立即勝利', () => {
    const b = C.createBoard(); [3,4,5,6].forEach(c => { b[8][c] = C.BLACK; });
    const [r,c] = window.GomokuAI.chooseMove(b, C.WHITE, C.BLACK);
    assert(r === 8 && (c === 2 || c === 7), `收到 ${r},${c}`);
  });
  const list = document.getElementById('results');
  let passed = 0;
  tests.forEach(({ name, fn }) => {
    const item = document.createElement('li');
    try { fn(); passed++; item.className = 'pass'; item.textContent = `通過：${name}`; }
    catch (error) { item.className = 'fail'; item.textContent = `失敗：${name}（${error.message}）`; }
    list.appendChild(item);
  });
  const summary = document.getElementById('summary');
  summary.textContent = `${passed}/${tests.length} 項測試通過`;
  summary.className = passed === tests.length ? 'pass' : 'fail';
})();
