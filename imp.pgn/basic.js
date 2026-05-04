document.addEventListener("DOMContentLoaded", () => {
  attachMenuListeners();
});

function attachMenuListeners() {
  const chesscomBtn = document.getElementById("chesscomBtn");
  const lichessBtn = document.getElementById("lichessBtn");

  if (chesscomBtn) {
    chesscomBtn.onclick = () => openFetchPanel("Chess.com");
  }

  if (lichessBtn) {
    lichessBtn.onclick = () => openFetchPanel("Lichess");
  }
}

function openFetchPanel(site) {
  const menu = document.getElementById("sideMenu");

  menu.innerHTML = `
    <button onclick="restoreMainMenu()">← Back</button>

    <h3 style="margin:0;color:white;">${site}</h3>

    <input
      id="usernameInput"
      type="text"
      placeholder="Enter username"
      style="
        padding:10px;
        border:none;
        border-radius:8px;
        font-size:16px;
        width:100%;
        box-sizing:border-box;
      "
    >

    <button onclick="fetchGames('${site}')">Fetch Games</button>

    <div id="gameList"></div>
  `;
}

function restoreMainMenu() {
  const menu = document.getElementById("sideMenu");

  menu.innerHTML = `
    <button onclick="closeMenu()">✕</button>

    <button id="chesscomBtn">Chess.com</button>

    <button id="lichessBtn">Lichess</button>

    <button onclick="toggleThemeMenu()">Theme ▼</button>

    <div id="themeOptions" style="display:none;">
      <button onclick="setBoardTheme('#f0d9b5','#b58863')">Classic</button>
      <button onclick="setBoardTheme('#dee3e6','#8ca2ad')">Blue</button>
      <button onclick="setBoardTheme('#eeeed2','#769656')">Green</button>
      <button onclick="setBoardTheme('#666','#333')">Dark</button>
    </div>

    <button onclick="importPGN()">Import PGN</button>
    
    <button onclick="reviewGame()">Analyze Game</button>
  `;

  attachMenuListeners();
}

async function fetchGames(site) {
  const username = document.getElementById("usernameInput").value.trim();
  const gameList = document.getElementById("gameList");

  if (!username) return;

  gameList.innerHTML =
    "<p style='color:white;'>Fetching...</p>";

  try {
    let games = [];

    if (site === "Lichess") {
      const res = await fetch(
        `https://lichess.org/api/games/user/${username}?max=10&pgnInJson=true`,
        {
          headers: {
            Accept: "application/x-ndjson"
          }
        }
      );

      const text = await res.text();

      games = text
        .trim()
        .split("\n")
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    }

    if (site === "Chess.com") {
      const archivesRes = await fetch(
        `https://api.chess.com/pub/player/${username}/games/archives`
      );

      const archivesData = await archivesRes.json();

      if (!archivesData.archives || !archivesData.archives.length) {
        throw new Error("No archives found");
      }

      const latestArchive =
        archivesData.archives[archivesData.archives.length - 1];

      const gamesRes = await fetch(latestArchive);
      const gamesData = await gamesRes.json();

      games = gamesData.games.slice(-10).reverse();
    }

    renderGames(site, games);

  } catch (err) {
    console.error(err);

    gameList.innerHTML =
      "<p style='color:red;'>Failed to fetch games</p>";
  }
}

function renderGames(site, games) {
  const gameList = document.getElementById("gameList");

  if (!games.length) {
    gameList.innerHTML =
      "<p style='color:white;'>No games found</p>";
    return;
  }

  gameList.innerHTML = "";

  games.forEach((game) => {
    let opponent = "Unknown";
    let result = "Draw";
    let color = "White";
    let timeControl = "Unknown";
    let date = "Unknown";
    let pgn = "";

    // -------- LICHESS --------
    if (site === "Lichess") {
      const username =
        document.getElementById("usernameInput").value.toLowerCase();

      const white = game.players.white.user?.name || "Anonymous";
      const black = game.players.black.user?.name || "Anonymous";

      const userIsWhite = white.toLowerCase() === username;

      color = userIsWhite ? "White" : "Black";
      opponent = userIsWhite ? black : white;

      pgn = game.pgn || "";

      if (game.winner) {
        const won =
          (game.winner === "white" && userIsWhite) ||
          (game.winner === "black" && !userIsWhite);

        result = won ? "Win" : "Loss";
      }

      timeControl =
        game.clock
          ? `${game.clock.initial / 60}+${game.clock.increment}`
          : "Casual";

      if (game.createdAt) {
        date = new Date(game.createdAt).toLocaleDateString();
      }
    }

    // -------- CHESS.COM --------
    if (site === "Chess.com") {
      const username =
        document.getElementById("usernameInput").value.toLowerCase();

      const white = game.white.username;
      const black = game.black.username;

      const userIsWhite = white.toLowerCase() === username;

      color = userIsWhite ? "White" : "Black";
      opponent = userIsWhite ? black : white;

      pgn = game.pgn || "";

      const myResult = userIsWhite
        ? game.white.result
        : game.black.result;

      if (["win", "checkmated", "timeout", "resigned", "lose"].includes(myResult)) {
        result = myResult === "win" ? "Win" : "Loss";
      }

      timeControl = game.time_control || game.time_class || "Unknown";

      if (game.end_time) {
        date = new Date(game.end_time * 1000).toLocaleDateString();
      }
    }

    // -------- CARD --------
    const card = document.createElement("div");

    card.style.background = "#333";
    card.style.borderRadius = "10px";
    card.style.padding = "12px";
    card.style.marginTop = "10px";
    card.style.textAlign = "left";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div style="font-weight:bold;font-size:16px;">
        vs ${opponent}
      </div>

      <div style="margin-top:6px;color:#ccc;">
        ${result} as ${color}
      </div>

      <div style="margin-top:4px;color:#aaa;font-size:14px;">
        ${timeControl}
      </div>

      <div style="margin-top:4px;color:#888;font-size:13px;">
        ${date}
      </div>
    `;
card.onclick = () => {
  loadPGN(pgn);
  closeMenu();
};
    

    gameList.appendChild(card);
  });
}