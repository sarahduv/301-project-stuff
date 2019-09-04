'use strict';

const grid = $('#four_in_a_row_grid');
const numRows = 7;
const numCols = 5;
const maxInARow = 5;
const useAIForSecondPlayer = true;
const absurdlyBig = 9999999;

// There are 2 directions in every line. 
// In horizontal line, there is left right
// In vertical line, there is up down
// In diagonal forward, there is upright and leftdown
// In diagonal backwards, there is upleft and downright
const lines = [
  [
    { row: 0, col: 1 }, // RIGHT
    { row: 0, col: -1 }, // LEFT
  ],
  [
    { row: 1, col: 0 }, // DOWN
    { row: -1, col: 0 }, // UP
  ],
  [
    { row: 1, col: 1 }, // DOWN RIGHT
    { row: -1, col: -1 }, // UP LEFT
  ],
  [
    { row: -1, col: 1 }, // UP RIGHT
    { row: 1, col: -1 }, // DOWN LEFT
  ]
];

let allCells = [];
let currentPlayer = 0;
let isGameRunning = false;

function initBoard() {
  for (let r = 0; r < numRows; r++) {
    let trEl = document.createElement('tr');
    trEl.classList.add('gridRow');

    for (let c = 0; c < numCols; c++) {
      let tdEl = document.createElement('td');
      tdEl.classList.add('gridCell');
      allCells.push(tdEl);
      tdEl.setAttribute('id', getCellID(r, c));
      tdEl.addEventListener('click', handleCellClick);
      trEl.appendChild(tdEl);
    }
    grid.append(trEl);
  }
  startGame();
}

function startGame(){
  isGameRunning = true;
  currentPlayer = 0;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      let tdEl = getCell(r, c);
      tdEl.classList.remove('cellPlayer_0');
      tdEl.classList.remove('cellPlayer_1');
      tdEl.location = { row: r, col: c };
      tdEl.player = null;
    }
  }
}

function nextPlayer() {
  if (currentPlayer === 0) {
    currentPlayer = 1;
    if (useAIForSecondPlayer) {
      playAITurn();
    }
  } else if (currentPlayer === 1) {
    currentPlayer = 0;
  }
}

// this is the id for the dom element at r and c
function getCellID(r, c) {
  return 'row_' + r + '_cell_' + c;
}

// returns the dom element or null if no such cell exist
function getCell(r, c) {
  return document.getElementById(getCellID(r, c));
}

function checkForWin(cellEl) {
  let sourceLocation = cellEl.location;
  let sourcePlayer = cellEl.player;
  for (let l = 0; l < lines.length; l++) {
    let currentLine = lines[l];
    let winningCells = [cellEl];
    for (let directionNum = 0; directionNum < currentLine.length; directionNum++) {
      let currentDirection = currentLine[directionNum];


      for (let distance = 1; distance < Math.max(numRows, numCols); distance++) {
        const adjRow = sourceLocation.row + (currentDirection.row * distance);
        const adjCol = sourceLocation.col + (currentDirection.col * distance);
        let elToCheck = getCell(adjRow, adjCol);
        if (elToCheck === null || elToCheck.player === null || elToCheck.player !== sourcePlayer) {
          break;
        } else if (elToCheck.player === sourcePlayer) {
          winningCells.push(elToCheck);
        }
      }
    }

    // finished going in that line in both directions for the distance we needed
    if (winningCells.length >= maxInARow) {
      console.log(winningCells);
      return true;
    }
  }

  return false;
}

// if we click on a cell
function handleCellClick(event) {
  if(!isGameRunning){
    return;
  }
  let cellEl = event.target;

  // if it already has a player, then we return and ignore the click
  if (cellEl.player !== null) {
    return;
  }

  playCell(cellEl);
}

function playCell(cellEl) {
  // otherwise we claim the cell by setting the player and adding a class
  cellEl.player = currentPlayer;
  cellEl.classList.add('cellPlayer_' + currentPlayer);

  // check if after playing there is a win
  if (checkForWin(cellEl)){
    isGameRunning = false;
    setTimeout(()=> {
      alert('Insert name of player ' + (currentPlayer + 1) + ' won');
    }, 200);
  } else {
    nextPlayer();
  }
}

function playAITurn() {
  let scoresForMoves = [];

  // Go over all the cells
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellEl = getCell(r, c);
      if (cellEl.player !== null) {
        // The cell is not empty, no point in considering using it
        continue;
      }

      // For the cell, check up to the 8 cells around it
      if (!isAdjacentToOccupied(r,c)) {
        continue;
      }

      // So now we are in an open cell that is adjacent
      // to the enemy! (the player 0)
      // PRETEND WE TAKE IT FOR OURSELVES
      cellEl.player = 1;

      const score = seeHowWeLikeThisBoardNow();
      scoresForMoves.push({row: r, col: c, score: score});

      // Taking back our pretended move, clearing that cell
      cellEl.player = null;
    }
  }

  if (scoresForMoves.length === 0) {
    alert("There are no more possible moves");
    return;
  }

  // Sort all the scores for moves based on the score
  // Highest score first
  scoresForMoves.sort((a,b) => b.score - a.score);
  const bestMove = scoresForMoves[0];
  const bestCellToPlay = getCell(bestMove.row, bestMove.col);
  console.log("Computer played: ", bestCellToPlay);
  playCell(bestCellToPlay);
}

function isAdjacentToOccupied(row, col) {
  // For every direction
  for (let l = 0; l < lines.length; l++) {
    const currentLine = lines[l];
    // CurrentLine for example is "Up Down"
    // [
    //   { col: 0, row: -1}, // up 
    //   { col: 0, row: 1}  // down 
    // ]
    for (let d = 0; d < currentLine.length; ++d) {
      const currentDir = currentLine[d];
      // So this is one of the 8 directions
      const adjRow = row + currentDir.row;
      const adjCol = col + currentDir.col;

      const adjCell = getCell(adjRow, adjCol);
      if (adjCell !== null && adjCell.player !== null) {
        return true;
      }
    }
  }
  return false;
}

// This amazingly complex function ;) goes over the board
// and returns a score of how much we like this board
// The higher the score, the better it is for us - the AI
// The lower the score, the better it is for the human player
function seeHowWeLikeThisBoardNow() {
  const humanScore = getScoreForPlayer(0, maxInARow);
  const computerScore = getScoreForPlayer(1, maxInARow);  
  return computerScore - humanScore;
}

// This will give me a number, the higher it is, the better it is for player
// for example, if he is almost completing a 4 in a row, it will be REALLY high
//
// A score for a player, is the sum of all the scores of all the cells for the player
function getScoreForPlayer(player, bestStreak) {
  // examples of situations
  // enemey,player,player,enemey .... then this is worth nothing to the player
  // empty,player,player,empty ... that's fairly good
  // enemey,player,player,empty .. that's .. okayish.. better than locked

  let overall_board_score_for_player = 0;
  // Go over all the cells
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellEl = getCell(r, c);
      if (cellEl.player !== player) {
        // I only care about cells that belong to player, which I'm scoring
        continue;
      }

      const cellscore = getScoreForPlayerForCell(cellEl, bestStreak);
      overall_board_score_for_player += cellscore;
    }
  }
  return overall_board_score_for_player;
}

// This simple scoring function only looks at streaks and so if someone 
// plays with a gap on purpose, it will outsmart the scoring
function getScoreForPlayerForCell(cellEl, bestStreak) {
  let result_score = 0;
  let sourceLocation = cellEl.location;
  let sourcePlayer = cellEl.player;
  for (let l = 0; l < lines.length; l++) {
    let currentLine = lines[l];
    let winningCells = [cellEl];
    let playableCells = [];
    for (let directionNum = 0; directionNum < currentLine.length; directionNum++) {
      let currentDirection = currentLine[directionNum];

      for (let distance = 1; distance < Math.max(numRows, numCols); distance++) {
        const adjRow = sourceLocation.row + (currentDirection.row * distance);
        const adjCol = sourceLocation.col + (currentDirection.col * distance);
        let elToCheck = getCell(adjRow, adjCol);
        if (elToCheck === null) {
          break;
        } else if (elToCheck.player === null) {
          // If it's empty, I can still play it
          playableCells.push({row: adjRow, col: adjCol});

          // If this is the first "hole" we encounter, try to pretend it's not
          // the end of the streak by not breaking
          if (playableCells.length >= 2) {
            break;
          }
        } else if (elToCheck.player !== sourcePlayer) {
          break;
        } else if (elToCheck.player === sourcePlayer) {
          winningCells.push(elToCheck);
        }
      }
    }

    // winningCells.length are the current streak I have
    // playableCells.length are my "options" to continue it (between 0 and 2)
    // if playable length is 0.. this is worth nothing to me
    // if playable cells is 1.. it's okayish but if it's 2.. it's good for me I can play both sides
    if (winningCells.length === bestStreak) {
      // This is our winning move. we should do it no doubt
      return absurdlyBig;
    }

    if (winningCells.length === (bestStreak - 1) && playableCells.length > 0) {
      return absurdlyBig/1000;
    } 

    result_score += winningCells.length * playableCells.length;
  }

  return result_score;
}

$('#four_in_a_row_start').on('click', () => {startGame()});

initBoard();
