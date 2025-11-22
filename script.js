const dungeon = {
  start: "A",
  goal: "G",
  size: 5,
  rooms: {
    A: {
      name: "スタートの間",
      desc: "湿った石畳の小部屋。奥に２つの扉が見える。",
      pos: [0, 2],
      doors: [
        { label: "苔むした青の扉", to: "B", hint: "低い天井の通路" },
        { label: "錆びた赤の扉", to: "C", hint: "水音のする下り坂" },
      ],
    },
    B: {
      name: "低い天井の通路",
      desc: "ひんやりとした風。松明の煙が漂う。",
      pos: [1, 2],
      doors: [
        { label: "静かな鉄扉", to: "D", hint: "光がちらつく" },
        { label: "吊り橋の扉", to: "E", hint: "湿った木の匂い" },
      ],
    },
    C: {
      name: "滴る水路",
      desc: "足首ほどの水。壁の苔が光る。",
      pos: [0, 3],
      doors: [
        { label: "湿った回廊", to: "E", hint: "かすかなすすり泣き" },
        { label: "細い戻り道", to: "A", hint: "スタートへ引き返す" },
      ],
    },
    D: {
      name: "松明の間",
      desc: "松明が並び、足音がよく響く。",
      pos: [2, 2],
      doors: [
        { label: "光へ進む", to: "F", hint: "石像の影が動いた気がする" },
        { label: "風の抜け道", to: "H", hint: "高い位置から風" },
      ],
    },
    E: {
      name: "崩れた書庫",
      desc: "古い書架の残骸。紙の匂いが重い。",
      pos: [1, 3],
      doors: [
        { label: "書架の裏手", to: "D", hint: "灯りが見える" },
        { label: "湿気た石段", to: "C", hint: "水滴の音が続く" },
      ],
    },
    F: {
      name: "石像の広間",
      desc: "巨大な石像が２体。目がこちらを追う。",
      pos: [3, 2],
      doors: [
        { label: "像の陰の扉", to: "G", hint: "微かな光" },
        { label: "振り返る扉", to: "E", hint: "過去へ戻る気配" },
      ],
    },
    H: {
      name: "吹き抜けの足場",
      desc: "高い天井に穴。冷たい風が落ちてくる。",
      pos: [2, 1],
      doors: [
        { label: "梯子を登る", to: "D", hint: "松明の揺れ" },
        { label: "裂け目へ滑り込む", to: "G", hint: "出口の光が差す" },
      ],
    },
    G: {
      name: "出口の光",
      desc: "眩しい外の世界。新鮮な空気が流れ込む。",
      pos: [4, 2],
      doors: [],
      goal: true,
    },
  },
};

const mapEl = document.getElementById("map");
const doorsEl = document.getElementById("doors");
const roomNameEl = document.getElementById("room-name");
const roomDescEl = document.getElementById("room-desc");
const pathLabelEl = document.getElementById("path-label");
const statusPillEl = document.getElementById("status-pill");
const stepsEl = document.getElementById("steps");
const logEl = document.getElementById("log");
const pulseEl = document.getElementById("pulse");
const resetBtn = document.getElementById("reset-btn");
const trolleyOverlayEl = document.getElementById("trolley-overlay");
const trolleyCartEl = document.getElementById("trolley-cart");
const cartLabelEl = document.getElementById("cart-label");
const trolleyCountEl = document.getElementById("trolley-count");
const trolleyCaptionEl = document.getElementById("trolley-caption");

const doorTemplate = document.getElementById("door-template");
const logTemplate = document.getElementById("log-template");

const TROLLEY_MS = 1400;

let state = {
  current: dungeon.start,
  steps: 0,
  visited: new Set([dungeon.start]),
  history: [],
  walking: false,
};

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

function setStatus(text, glow = true) {
  statusPillEl.textContent = text;
  statusPillEl.classList.toggle("pill-glow", glow);
  pulseEl.classList.toggle("idle", !glow);
}

function renderMap() {
  mapEl.innerHTML = "";
  for (let y = 0; y < dungeon.size; y += 1) {
    for (let x = 0; x < dungeon.size; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const roomId = Object.keys(dungeon.rooms).find((id) => {
        const [rx, ry] = dungeon.rooms[id].pos;
        return rx === x && ry === y;
      });
      if (roomId) {
        const isCurrent = roomId === state.current;
        const isVisited = state.visited.has(roomId);
        const isGoal = roomId === dungeon.goal;
        if (isVisited) cell.classList.add("visited");
        if (isCurrent) cell.classList.add("current");
        if (isGoal) cell.classList.add("goal");
        cell.textContent = isCurrent ? "●" : isVisited ? "□" : "・";
        cell.title = `${dungeon.rooms[roomId].name}`;
      } else {
        cell.textContent = " ";
      }
      mapEl.appendChild(cell);
    }
  }
}

function renderRoom() {
  const room = dungeon.rooms[state.current];
  roomNameEl.textContent = room.name;
  roomDescEl.textContent = room.desc;
  pathLabelEl.textContent = room.goal ? "出口" : `部屋 ${state.current}`;
  doorsEl.innerHTML = "";

  if (room.goal) {
    setStatus("クリア！", true);
    const finish = doorTemplate.content.cloneNode(true);
    const btn = finish.querySelector("button");
    finish.querySelector(".door-label").textContent = "もう一度潜る";
    finish.querySelector(".door-next").textContent = "スタートに戻る";
    finish.querySelector(".door-footsteps").textContent = "冒険を再開";
    btn.addEventListener("click", reset);
    doorsEl.appendChild(finish);
    return;
  }

  room.doors.forEach((door, index) => {
    const clone = doorTemplate.content.cloneNode(true);
    clone.querySelector(".door-label").textContent = `${index === 0 ? "左" : "右"}の扉：${door.label}`;
    clone.querySelector(".door-next").textContent = door.hint;
    const btn = clone.querySelector("button");
    btn.addEventListener("click", () => rideTo(door.to, door.label, index));
    doorsEl.appendChild(clone);
  });
}

function renderLog() {
  logEl.innerHTML = "";
  state.history.slice(-8).reverse().forEach((entry) => {
    const row = logTemplate.content.cloneNode(true);
    row.querySelector(".log-time").textContent = entry.time;
    row.querySelector(".log-text").textContent = entry.text;
    logEl.appendChild(row);
  });
}

function addLog(text) {
  state.history.push({ time: formatTime(), text });
  renderLog();
}

function updateSteps() {
  stepsEl.textContent = `歩数 ${state.steps}`;
}

function startTrolley(label, dirIndex) {
  cartLabelEl.textContent = label;
  trolleyCaptionEl.textContent = `${dirIndex === 0 ? "左" : "右"}レーンへ切り替え！`;
  trolleyOverlayEl.classList.add("active");
  trolleyCartEl.dataset.dir = dirIndex === 0 ? "left" : "right";
  trolleyCartEl.style.setProperty("--tilt", dirIndex === 0 ? "-6deg" : "6deg");
  trolleyCartEl.classList.remove("animate");
  void trolleyCartEl.offsetWidth;
  trolleyCartEl.classList.add("animate");
  trolleyCountEl.textContent = "GO!";
}

function stopTrolley() {
  trolleyOverlayEl.classList.remove("active");
}

function rideTo(nextRoomId, label, dirIndex = 0) {
  if (state.walking) return;
  const nextRoom = dungeon.rooms[nextRoomId];
  if (!nextRoom) return;

  state.walking = true;
  setStatus("トロッコ出発中...", true);
  doorsEl.querySelectorAll("button").forEach((btn) => (btn.disabled = true));

  const logLabel = `「${label}」の線路を選択`;
  addLog(logLabel);
  startTrolley(label, dirIndex);

  // Simulate trolley ride duration
  setTimeout(() => {
    state.current = nextRoomId;
    state.steps += 1;
    state.visited.add(nextRoomId);
    setStatus(nextRoom.goal ? "出口に到達！" : "到着", !nextRoom.goal);
    renderMap();
    renderRoom();
    updateSteps();
    if (nextRoom.goal) {
      addLog("出口の光を見つけた！");
    }
    stopTrolley();
    state.walking = false;
  }, TROLLEY_MS);
}

function reset() {
  state = {
    current: dungeon.start,
    steps: 0,
    visited: new Set([dungeon.start]),
    history: [],
    walking: false,
  };
  setStatus("準備OK", true);
  renderMap();
  renderRoom();
  renderLog();
  updateSteps();
  stopTrolley();
}

resetBtn.addEventListener("click", reset);

reset();
