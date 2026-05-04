function loadPGN(pgn) {
  if (!pgn) return;

  game.reset();
  moveHistory = [];
  currentIndex = 0;

  game.load_pgn(pgn);

  const history = game.history({ verbose: true });

  moveHistory = history;

  game.reset();
  currentIndex = 0;

  board.position(game.fen());
  updatePGN();

  if (typeof analyzePosition === "function") {
    analyzePosition(game.fen());
  }
}

function importPGN() {
  const pgn = prompt("Paste PGN here:");
  if (!pgn) return;

  loadPGN(pgn);
}