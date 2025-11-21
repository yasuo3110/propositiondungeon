const questions = [
  {
    text: "実数 a, b がともに正のとき、a + b ≥ 2√(ab) が成り立つ。",
    answer: true,
    explain:
      "相加平均と相乗平均の大小関係（AM ≥ GM）より常に真。等号は a = b のとき成立します。",
  },
  {
    text: "任意の実数 x について、sin²x + cos²x = 0 が成り立つ。",
    answer: false,
    explain:
      "三角恒等式 sin²x + cos²x = 1 が成り立つ。0 になることはありません。",
  },
  {
    text: "実数 x, y が 0 より大ならば、(x + y)^2 > x^2 + y^2 が成り立つ。",
    answer: true,
    explain:
      "(x + y)^2 = x^2 + 2xy + y^2 で 2xy > 0 なので不等号は常に真。",
  },
];

const dom = {
  doorArea: document.getElementById("door-area"),
  prompt: document.getElementById("prompt"),
  streak: document.getElementById("streak"),
  gems: document.getElementById("gems"),
  stage: document.getElementById("stage"),
  doors: Array.from(document.querySelectorAll(".door")),
  overlay: document.getElementById("result"),
  status: document.getElementById("result-status"),
  explain: document.getElementById("explain"),
  next: document.getElementById("next-btn"),
  escape: document.getElementById("escape-btn"),
  retry: document.getElementById("retry-btn"),
  scene: document.querySelector(".scene"),
};

const state = {
  index: 0,
  gems: 0,
  streak: 0,
  busy: false,
};

function pickQuestion() {
  state.index = (state.index + 1) % questions.length;
  return questions[state.index];
}

function setQuestion(q) {
  dom.prompt.textContent = q.text;
  dom.stage.textContent = state.index + 1;
  dom.doorArea.classList.remove("busy");
  dom.doors.forEach((door) => door.classList.remove("selected"));
}

function updateScore() {
  dom.gems.textContent = state.gems;
  dom.streak.textContent = state.streak;
}

function showResult({ success, explain }) {
  dom.status.textContent = success ? "宝石を獲得！" : "奈落の底へ…";
  dom.status.style.color = success ? "#50e2c6" : "#ff5f6d";
  dom.explain.textContent = explain;
  dom.next.classList.toggle("hidden", !success);
  dom.escape.classList.toggle("hidden", !success);
  dom.retry.classList.toggle("hidden", success);
  dom.overlay.classList.remove("hidden");
}

function hideResult() {
  dom.overlay.classList.add("hidden");
  dom.scene.classList.remove("falling");
}

function handleChoice(choice) {
  if (state.busy) return;
  state.busy = true;
  dom.doorArea.classList.add("busy");
  dom.scene.classList.add("advance");

  dom.doors.forEach((d) => {
    d.classList.toggle("selected", d.dataset.choice === String(choice));
  });

  setTimeout(() => {
    const q = questions[state.index];
    const success = q.answer === choice;

    dom.scene.classList.remove("advance");

    if (success) {
      state.gems += 1;
      state.streak += 1;
    } else {
      state.streak = 0;
      dom.scene.classList.add("falling");
    }

    updateScore();
    showResult({ success, explain: q.explain });
    state.busy = false;
  }, 1100);
}

function nextStep() {
  hideResult();
  setTimeout(() => {
    const q = pickQuestion();
    setQuestion(q);
  }, 300);
}

function gameOverReset() {
  hideResult();
  state.gems = 0;
  state.streak = 0;
  updateScore();
  const q = pickQuestion();
  setQuestion(q);
}

function init() {
  const first = questions[state.index];
  setQuestion(first);
  updateScore();

  dom.doors.forEach((door) => {
    door.addEventListener("click", () => {
      const choice = door.dataset.choice === "true";
      handleChoice(choice);
    });
  });

  dom.next.addEventListener("click", nextStep);
  dom.escape.addEventListener("click", () => {
    hideResult();
    state.streak = 0;
    updateScore();
    const q = pickQuestion();
    setQuestion(q);
  });

  dom.retry.addEventListener("click", gameOverReset);
}

document.addEventListener("DOMContentLoaded", init);
