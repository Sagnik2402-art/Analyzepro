// evaluation.js
let currentDepth = 6;
let engine = null;
let evalListener = null;

try {
  engine = new Worker("engine/stockfish-18-lite-single.js");

  engine.onmessage = function(event) {
    const line = event.data;
    console.log("SF:", line);

    // Mate
    let mateMatch = line.match(/score mate (-?\d+)/);
    if (mateMatch) {
      let mate = parseInt(mateMatch[1]);

      if (game.turn() === "b") {
        mate = -mate;
      }

      if (mate > 0) {
        updateEvalBar("M" + mate, 100);
      } else {
        updateEvalBar("M" + mate, 0);
      }

      return;
    }

    // Centipawn eval
    let cpMatch = line.match(/score cp (-?\d+)/);
    if (cpMatch) {
      let cp = parseInt(cpMatch[1]) / 100;

      // convert to White's perspective
      if (game.turn() === "b") {
        cp = -cp;
      }

      // smooth scaling
      let percent = 50 + 45 * Math.tanh(cp / 3);

      updateEvalBar(cp, percent);
    }
  };

  // initialize engine
  engine.postMessage("uci");

} catch (e) {
  console.log("Stockfish failed:", e);
}

let analysisTimer = null;

function analyzePosition(fen) {
  if (!engine) return;

  clearTimeout(analysisTimer);

  analysisTimer = setTimeout(() => {
    try {
      engine.postMessage("stop");
      engine.postMessage("position fen " + fen);
      engine.postMessage("go depth " + currentDepth);
    } catch (e) {
      console.log("Analysis error:", e);
    }
  }, 120);
}

function setDepth(depth) {
  currentDepth = Number(depth);

  const label = document.getElementById("depthValue");
  if (label) {
    label.innerText = currentDepth;
  }

  console.log("Depth:", currentDepth);

  if (typeof game !== "undefined") {
    analyzePosition(game.fen());
  }
}

function updateEvalBar(value, percent) {
  const fill = document.getElementById("evalFill");
  const text = document.getElementById("evalText");

  if (!fill || !text) return;

  fill.style.height = percent + "%";

  if (typeof value === "number") {
    text.innerText =
      value > 0
        ? "+" + value.toFixed(1)
        : value.toFixed(1);
  } else {
    text.innerText = value;
  }
}

function setEvalListener(callback) {
  evalListener = callback;
}

if (typeof setEvalListener === "function") {
  setEvalListener(function(evalValue) {
    document.getElementById("evalBar").innerText = evalValue;
  });
}