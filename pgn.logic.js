function updatePGN() {
  const container = document.getElementById("pgnBar");
  container.innerHTML = "";

  let activeMove = null;

  for (let i = 0; i < moveHistory.length; i++) {
    const moveText =
      typeof moveHistory[i] === "string"
        ? moveHistory[i]
        : moveHistory[i].san;

    const move = document.createElement("div");
    move.className = "move";

    if (i === currentIndex - 1) {
      move.style.background = "#666";
      activeMove = move;
    } else {
      move.style.background = "#222";
    }

    if (i % 2 === 0) {
      move.innerText = `${Math.floor(i / 2) + 1}. ${moveText}`;
    } else {
      move.innerText = moveText;
    }

    container.appendChild(move);
  }

  // wait one frame so browser computes positions
  requestAnimationFrame(() => {
    if (!activeMove) return;

    const target =
      activeMove.offsetLeft -
      (container.clientWidth / 2) +
      (activeMove.offsetWidth / 2);

    container.scrollLeft = Math.max(0, target);
  });
}