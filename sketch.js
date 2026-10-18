/*
 * Tic-Tac-Toe Game in p5.js
 * Author: chaoaj
 * Date: 2026-10-18
 * Purpose: Two-player (optionally vs. computer) accessible tic-tac-toe,
 *          implemented per the project SRS v1.0.
 */

// ----- Constants -----
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // columns
  [0, 4, 8], [2, 4, 6]              // diagonals
];
const MIN_CANVAS = 300;
const CANVAS_MARGIN = 40;
const GRID_WEIGHT = 4;
const MARK_SCALE = 0.6;
const MARK_WEIGHT = 8;
const FOCUS_WEIGHT = 3;
const WIN_WEIGHT = 8;
const COLOR_BG = '#FFFFFF';
const COLOR_GRID = '#333333';
const COLOR_X = '#B00020';
const COLOR_O = '#0B4F9C';
const COLOR_FOCUS = '#C26A00';
const COLOR_WIN = '#1B7F3A';
const COMPUTER_DELAY_MIN = 400;
const COMPUTER_DELAY_MAX = 800;

// ----- State -----
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameState = 'playing';
let winner = null;
let winLine = null;
let focusIndex = 4;
let scores = { X: 0, O: 0, draws: 0 };
let firstPlayer = 'X';
let vsComputer = false;
let computerTimer = null;
let boardSize = MIN_CANVAS;
let canvasEl = null;

// ----- Logic (no drawing) -----
function otherPlayer(p) {
  return p === 'X' ? 'O' : 'X';
}

function resetBoard() {
  board = Array(9).fill('');
  gameState = 'playing';
  winner = null;
  winLine = null;
  currentPlayer = firstPlayer;
}

function isValidMove(i) {
  return gameState === 'playing' && Number.isInteger(i) && i >= 0 && i < 9 && board[i] === '';
}

// Returns "X", "O", "draw", or null (pure function).
function checkWinner(b) {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] !== '' && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every((cell) => cell !== '') ? 'draw' : null;
}

function findWinLine(b) {
  return WIN_LINES.find(([a, c, d]) => b[a] !== '' && b[a] === b[c] && b[a] === b[d]) || null;
}

// Places the current player's mark; returns true if the move was made.
function makeMove(i) {
  if (!isValidMove(i)) return false;
  board[i] = currentPlayer;
  const result = checkWinner(board);
  if (result === 'X' || result === 'O') {
    gameState = 'won';
    winner = result;
    winLine = findWinLine(board);
    scores[result]++;
  } else if (result === 'draw') {
    gameState = 'draw';
    scores.draws++;
  } else {
    currentPlayer = otherPlayer(currentPlayer);
  }
  return true;
}

function computerChoose(b, me) {
  const empty = [];
  b.forEach((cell, i) => { if (cell === '') empty.push(i); });
  const completes = (player) => empty.find((i) => {
    const t = b.slice();
    t[i] = player;
    return checkWinner(t) === player;
  });
  const win = completes(me);
  if (win !== undefined) return win;
  const block = completes(otherPlayer(me));
  if (block !== undefined) return block;
  if (b[4] === '') return 4;
  const corner = [0, 2, 6, 8].find((i) => b[i] === '');
  if (corner !== undefined) return corner;
  return empty[0];
}

// ----- Description helpers -----
function cellName(i) {
  return 'row ' + (Math.floor(i / 3) + 1) + ', column ' + ((i % 3) + 1);
}

function describeBoard() {
  return board
    .map((c, i) => cellName(i) + ': ' + (c === '' ? 'empty' : c))
    .join('. ') + '.';
}

function statusText() {
  if (gameState === 'won') return 'Player ' + winner + ' wins!';
  if (gameState === 'draw') return "It's a draw.";
  return 'Player ' + currentPlayer + "'s turn";
}

// ----- Output -----
function announce(msg) {
  document.getElementById('announcer').textContent = msg;
}

function updateStatus() {
  document.getElementById('status').textContent = statusText();
}

function updateScoreboard() {
  document.getElementById('scores').textContent =
    'X wins: ' + scores.X + ' | O wins: ' + scores.O + ' | Draws: ' + scores.draws;
}

function refresh() {
  updateStatus();
  updateScoreboard();
  redraw();
}

// ----- Game flow -----
function playMove(i) {
  if (gameState !== 'playing') {
    announce(statusText() + ' Start a new round to keep playing.');
    return;
  }
  if (!isValidMove(i)) {
    announce('That cell is taken.');
    return;
  }
  const mover = currentPlayer;
  makeMove(i);
  let msg = mover + ' placed in ' + cellName(i) + '.';
  if (gameState === 'playing') msg += ' ' + currentPlayer + "'s turn.";
  else msg += ' ' + statusText();
  announce(msg);
  refresh();
  scheduleComputer();
}

function scheduleComputer() {
  clearTimeout(computerTimer);
  computerTimer = null;
  if (vsComputer && gameState === 'playing' && currentPlayer === 'O') {
    const delay = COMPUTER_DELAY_MIN + Math.random() * (COMPUTER_DELAY_MAX - COMPUTER_DELAY_MIN);
    computerTimer = setTimeout(() => {
      computerTimer = null;
      if (gameState === 'playing' && currentPlayer === 'O') {
        playMove(computerChoose(board, 'O'));
      }
    }, delay);
  }
}

function newRound() {
  clearTimeout(computerTimer);
  firstPlayer = otherPlayer(firstPlayer);
  resetBoard();
  announce('New round. ' + statusText() + '.');
  refresh();
  scheduleComputer();
}

function resetScore() {
  clearTimeout(computerTimer);
  scores = { X: 0, O: 0, draws: 0 };
  firstPlayer = 'X';
  resetBoard();
  announce('Score reset. ' + statusText() + '.');
  refresh();
  scheduleComputer();
}

// ----- p5 setup / layout -----
function computeBoardSize() {
  return Math.max(MIN_CANVAS, Math.min(windowWidth, windowHeight) - CANVAS_MARGIN);
}

function setup() {
  boardSize = computeBoardSize();
  const c = createCanvas(boardSize, boardSize);
  c.parent('canvas-holder');
  canvasEl = c.elt;
  canvasEl.setAttribute('tabindex', '0');
  canvasEl.setAttribute('role', 'application');
  canvasEl.setAttribute('aria-label',
    'Tic-tac-toe board. Use arrow keys or 1 to 9 to move, Enter or Space to play, B to describe the board.');
  describe('Tic-tac-toe board, 3 by 3 grid.');

  document.getElementById('new-round').addEventListener('click', newRound);
  document.getElementById('reset-score').addEventListener('click', resetScore);
  document.getElementById('mode').addEventListener('change', (e) => {
    vsComputer = e.target.value === 'computer';
    resetBoard();
    announce(vsComputer ? 'Vs. Computer mode. ' + statusText() + '.' : 'Two Players mode. ' + statusText() + '.');
    refresh();
    scheduleComputer();
  });
  noLoop();
  refresh();
}

function windowResized() {
  boardSize = computeBoardSize();
  resizeCanvas(boardSize, boardSize);
  redraw();
}

// ----- Drawing -----
function drawMark(mark, cx, cy, size) {
  const half = (size * MARK_SCALE) / 2;
  strokeWeight(MARK_WEIGHT);
  noFill();
  if (mark === 'X') {
    stroke(COLOR_X);
    line(cx - half, cy - half, cx + half, cy + half);
    line(cx - half, cy + half, cx + half, cy - half);
  } else if (mark === 'O') {
    stroke(COLOR_O);
    circle(cx, cy, half * 2);
  }
}

function draw() {
  background(COLOR_BG);
  const cell = width / 3;

  stroke(COLOR_GRID);
  strokeWeight(GRID_WEIGHT);
  line(cell, 0, cell, height);
  line(cell * 2, 0, cell * 2, height);
  line(0, cell, width, cell);
  line(0, cell * 2, width, cell * 2);

  board.forEach((mark, i) => {
    drawMark(mark, (i % 3) * cell + cell / 2, Math.floor(i / 3) * cell + cell / 2, cell);
  });

  if (winLine) {
    const centre = (i) => [(i % 3) * cell + cell / 2, Math.floor(i / 3) * cell + cell / 2];
    const [x1, y1] = centre(winLine[0]);
    const [x2, y2] = centre(winLine[2]);
    stroke(COLOR_WIN);
    strokeWeight(WIN_WEIGHT);
    line(x1, y1, x2, y2);
  }

  noFill();
  stroke(COLOR_FOCUS);
  strokeWeight(FOCUS_WEIGHT);
  rect((focusIndex % 3) * cell + FOCUS_WEIGHT * 2, Math.floor(focusIndex / 3) * cell + FOCUS_WEIGHT * 2,
    cell - FOCUS_WEIGHT * 4, cell - FOCUS_WEIGHT * 4);
}

// ----- Input -----
function mousePressed() {
  if (mouseX < 0 || mouseY < 0 || mouseX >= width || mouseY >= height) return;
  const cell = width / 3;
  focusIndex = Math.floor(mouseY / cell) * 3 + Math.floor(mouseX / cell);
  playMove(focusIndex);
  redraw();
}

function keyPressed() {
  if (document.activeElement !== canvasEl) return;
  if (keyIsDown(CONTROL) || keyIsDown(ALT)) return;
  let handled = true;
  const row = Math.floor(focusIndex / 3);
  const col = focusIndex % 3;
  if (keyCode === UP_ARROW) focusIndex = Math.max(row - 1, 0) * 3 + col;
  else if (keyCode === DOWN_ARROW) focusIndex = Math.min(row + 1, 2) * 3 + col;
  else if (keyCode === LEFT_ARROW) focusIndex = row * 3 + Math.max(col - 1, 0);
  else if (keyCode === RIGHT_ARROW) focusIndex = row * 3 + Math.min(col + 1, 2);
  else if (key >= '1' && key <= '9') focusIndex = parseInt(key, 10) - 1;
  else if (keyCode === ENTER || key === ' ') playMove(focusIndex);
  else if (key === 'n' || key === 'N') newRound();
  else if (key === 'r' || key === 'R') resetScore();
  else if (key === 'b' || key === 'B') announce(describeBoard());
  else handled = false;
  if (handled) {
    redraw();
    return false;
  }
}
