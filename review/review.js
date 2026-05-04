let gameReview = [];
let reviewDepth = 8;
const BATCH_SIZE = 6;

window.reviewGame = async function () {
  console.log("Starting review...");

  if (!moveHistory.length) {
    alert("No game loaded");
    return;
  }

  gameReview = [];

  const reviewGameObj = new Chess();
  const total = moveHistory.length;
  const fens = [];

  // build all positions first
  for (let i = 0; i < total; i++) {
    const played = reviewGameObj.move(moveHistory[i].san || moveHistory[i]);

    if (!played) {
      console.log("Bad move at:", i + 1);
      console.log(moveHistory[i]);
      alert("Review failed at move " + (i + 1));
      return;
    }

    fens.push(reviewGameObj.fen());
  }

  // analyze in batches
  for (let start = 0; start < fens.length; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, fens.length);

    console.log(`Batch ${start + 1} → ${end}`);

    try {
      const batchScores = await analyzeBatch(
        fens.slice(start, end),
        start,
        total
      );

      gameReview.push(...batchScores);
    } catch (e) {
      console.log("Batch failed:", e);
      alert("Review crashed");
      return;
    }
  }

  console.log("Review finished");
  console.log("Final review:", JSON.stringify(gameReview));

  drawReviewGraph(gameReview);
  const acc = calculateAccuracy(gameReview);
  
  document.getElementById("whiteAccuracy").textContent =
  acc.white + "%";

document.getElementById("blackAccuracy").textContent =
  acc.black + "%";
  
console.log("White accuracy:", acc.white + "%");
console.log("Black accuracy:", acc.black + "%");
};

function analyzeBatch(batchFens, offset, totalMoves) {
  return new Promise((resolve, reject) => {
    const tempEngine = new Worker("engine/stockfish-18-lite-single.js");

    const scores = [];
    let index = 0;
    let latestScore = 0;

    tempEngine.onmessage = function (event) {
      const line = String(event.data);

      const mateMatch = line.match(/score mate (-?\d+)/);
      if (mateMatch) {
        latestScore = parseInt(mateMatch[1]) > 0 ? 100 : -100;
      }

      const cpMatch = line.match(/score cp (-?\d+)/);
      if (cpMatch) {
        latestScore = parseInt(cpMatch[1]) / 100;
      }

      if (line.startsWith("bestmove")) {
        let corrected = latestScore;

// if black to move, flip score so everything stays
// from White's perspective
if (batchFens[index].includes(" b ")) {
  corrected = -corrected;
}

scores.push(corrected);;

        console.log(
          `Analyzing ${offset + index + 1}/${totalMoves} | Score: ${latestScore}`
        );

        index++;

        if (index >= batchFens.length) {
          tempEngine.terminate();
          resolve(scores);
          return;
        }

        latestScore = 0;

        tempEngine.postMessage("position fen " + batchFens[index]);
        tempEngine.postMessage("go depth " + reviewDepth);
      }
    };

    tempEngine.onerror = function (err) {
      tempEngine.terminate();
      reject(err);
    };

    try {
      tempEngine.postMessage("uci");
      tempEngine.postMessage("position fen " + batchFens[0]);
      tempEngine.postMessage("go depth " + reviewDepth);
    } catch (e) {
      tempEngine.terminate();
      reject(e);
    }
  });
}

function calculateAccuracy(scores) {
  let white = [];
  let black = [];

  for (let i = 1; i < scores.length; i++) {
    const before = scores[i - 1];
    const after = scores[i];

    let loss;

    if (i % 2 === 1) {
      // White moved
      loss = Math.max(0, before - after);
      white.push(moveAccuracy(loss));
    } else {
      // Black moved
      loss = Math.max(0, after - before);
      black.push(moveAccuracy(loss));
    }
  }

  const avg = arr =>
    arr.length
      ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      : 100;

  return {
    white: avg(white),
    black: avg(black)
  };
}

function moveAccuracy(loss) {
  if (loss <= 0) return 100;
  return Math.max(0, Math.round(100 * Math.exp(-loss * 0.65)));
}