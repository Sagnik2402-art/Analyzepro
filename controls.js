function goStart() {
  isPlaying = false;

  game.reset();
  currentIndex = 0;

  board.position(game.fen());
  updatePGN();
  analyzePosition(game.fen());
  
  if (gameReview.length) drawReviewGraph(gameReview);
  
}

function goPrev() {
  console.log("currentIndex =", currentIndex);
  console.log("moveHistory length =", moveHistory.length);

  if (currentIndex === 0) {
    console.log("blocked");
    return;
    
  }

  game.undo();
  currentIndex--;

  board.position(game.fen());
  updatePGN();
  analyzePosition(game.fen());

if (gameReview.length) drawReviewGraph(gameReview);

  console.log("moved back");
}

function goNext() {
  isPlaying = false;

  if (currentIndex >= moveHistory.length) return;

  game.move(moveHistory[currentIndex]);
  currentIndex++;

  board.position(game.fen());
  updatePGN();
  analyzePosition(game.fen());
  
  if (gameReview.length) drawReviewGraph(gameReview);
}

function goEnd() {
  isPlaying = false;

  game.reset();

  for (let move of moveHistory) {
    game.move(move);
  }

  currentIndex = moveHistory.length;

  board.position(game.fen());
  updatePGN();
  analyzePosition(game.fen());
  
  if (gameReview.length) drawReviewGraph(gameReview);
  
}

function playGame() {
  if (isPlaying) {
    isPlaying = false;
    return;
  }

  isPlaying = true;

  function step() {
    if (!isPlaying) return;

    if (currentIndex >= moveHistory.length) {
      isPlaying = false;
      return;
    }

    game.move(moveHistory[currentIndex]);
    currentIndex++;

    board.position(game.fen());
    updatePGN();
    analyzePosition(game.fen());

    setTimeout(step, 300);
  }

  step();
}
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
}

function flipBoard() {
  board.flip();
}