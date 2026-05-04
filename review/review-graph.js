function drawReviewGraph(scores) {
  const canvas = document.getElementById("reviewGraph");
  const wrap = document.getElementById("reviewGraphWrap");

  if (!canvas || !wrap || !scores.length) return;

  canvas.width = wrap.clientWidth - 16;
  canvas.height = 90;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const mid = h / 2;

  ctx.clearRect(0, 0, w, h);

  // background
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, w, h);

  // center line
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(w, mid);
  ctx.stroke();

  function normalize(score) {
    if (score >= 100) score = 10;
    if (score <= -100) score = -10;

    score = Math.max(-10, Math.min(10, score));

    return 3.2 * Math.tanh(score / 2.5);
  }

  function toY(score) {
    const n = normalize(score);
    return mid - (n / 4) * (mid - 10);
  }

  const smooth = scores.map((v, i) => {
    const a = scores[i - 1] ?? v;
    const b = v;
    const c = scores[i + 1] ?? v;
    return (a + b * 2 + c) / 4;
  });

  const step = w / Math.max(smooth.length - 1, 1);

  // fill
  ctx.beginPath();
  ctx.moveTo(0, mid);

  smooth.forEach((score, i) => {
    const x = i * step;
    const y = toY(score);
    ctx.lineTo(x, y);
  });

  ctx.lineTo(w, mid);
  ctx.closePath();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();

  // outline
  ctx.beginPath();

  smooth.forEach((score, i) => {
    const x = i * step;
    const y = toY(score);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = 2;
  ctx.stroke();

  // CURRENT MOVE CURSOR
  if (typeof currentIndex !== "undefined") {
    let x;

    if (currentIndex <= 0) x = 0;
    else if (currentIndex >= smooth.length) x = w;
    else x = currentIndex * step;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}