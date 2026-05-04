const game = new Chess();
let moveHistory = [];
let currentIndex = 0;
let isPlaying = false;
  let pendingPromotion = null;
  
const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: handleMove,
  onSnapEnd: function () {
    board.position(game.fen());
  }
});
function handleMove(source, target) {
  const piece = game.get(source);

  // Promotion check
  if (
    piece &&
    piece.type === "p" &&
    (
      (piece.color === "w" && target[1] === "8") ||
      (piece.color === "b" && target[1] === "1")
    )
  ) {
    pendingPromotion = { source, target };
    showPromotionPopup();
    return "snapback";
  }

  // Normal move
  const move = game.move({
    from: source,
    to: target,
    promotion: "q"
  });

  if (!move) return "snapback";

  // Update move history
  moveHistory = moveHistory.slice(0, currentIndex);
  moveHistory.push(move);
  currentIndex = moveHistory.length;

  // Update board
  board.position(game.fen());

  // Update PGN
  updatePGN();

  // Analyze
  if (typeof analyzePosition === "function") {
    try {
      analyzePosition(game.fen());
    } catch (e) {
      console.log("Engine error:", e);
    }
  }

  return;
}

function showPromotionPopup() {
  const popup = document.getElementById("promotionPopup");
  popup.style.display = "block";
}

document.querySelectorAll("#promotionPopup img").forEach(img => {
  img.onclick = function () {
    const promotion = this.dataset.piece;

    const move = game.move({
  from: pendingPromotion.source,
  to: pendingPromotion.target,
  promotion: promotion
});

if (move) {
  moveHistory = moveHistory.slice(0, currentIndex);
  moveHistory.push(move);
  currentIndex = moveHistory.length;

  board.position(game.fen());
  updatePGN();

  if (typeof analyzePosition === "function") {
    analyzePosition(game.fen());
  }
}
    
    

    pendingPromotion = null;

    document.getElementById("promotionPopup").style.display = "none";

    board.position(game.fen());
    updatePGN();
  };
});