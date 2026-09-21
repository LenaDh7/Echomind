const _el = id => document.getElementById(id);
function _puzzleEl()   { return _el("puzzle"); }
function _diffEl()     { return _el("difficulty"); }
function _statusEl()   { return _el("status"); }
function _timerEl()    { return _el("timer"); }
function _overlayEl()  { return _el("overlay"); }
function _resDiffEl()  { return _el("res-diff"); }
function _resTimeEl()  { return _el("res-time"); }
function _resMistEl()  { return _el("res-mistakes"); }

let _storyData    = null;
let _storySubMode = null;
let _dragSrc      = null;
let _touchCard    = null;
let _touchClone   = null;

function startStoryPuzzle() {
  clearInterval(window.__t);
  clearInterval(window.__countdown);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  document.getElementById("skip-flash-btn")?.remove();
  const ambient = document.getElementById("ambient");
  if (ambient && !ambient.paused) { ambient.pause(); window._storyPausedAmbient = true; }

  startMs = 0;
  _timerEl().textContent = "Time: 0.0s";
  mistakes = 0;
  _overlayEl().classList.add("hidden");
  const puzzleEl = _puzzleEl();
  puzzleEl.innerHTML = "";
  puzzleEl.className = "story-puzzle";
  _diffEl().textContent = difficulty;

  _storyData    = pickStory(difficulty);
  _storySubMode = pickSubMode(_storyData, difficulty);

  if (_storySubMode === "order" && (!_storyData.scenes || _storyData.scenes.length < 2)) _storySubMode = "question";
  if (_storySubMode === "question" && !_storyData.question) _storySubMode = "order";

  _buildUI();
}

function _buildUI() {
  const puzzleEl = _puzzleEl();
  const header = document.createElement("div");
  header.className = "story-header";
  header.innerHTML = `
    <div class="story-mode-badge">${_storySubMode === "order" ? "🖼️ Picture Order" : "❓ Story Question"}</div>
    <p class="story-instruction">Listen carefully to the story…</p>`;
  puzzleEl.appendChild(header);

  const narBox = document.createElement("div");
  narBox.className = "story-narration";
  narBox.id = "story-narration";
  narBox.innerHTML = `
    <span class="story-speaker" id="story-speaker">🔊</span>
    <p class="story-text" id="story-text"></p>
    <button class="ghost story-replay hidden" id="story-replay">↩ Replay story</button>`;
  puzzleEl.appendChild(narBox);

  const task = document.createElement("div");
  task.className = "story-task hidden";
  task.id = "story-task";
  puzzleEl.appendChild(task);

  setTimeout(_narrate, 500);
}

function _narrate() {
  const textEl = document.getElementById("story-text");
  if (textEl) { textEl.textContent = _storyData.text; textEl.classList.add("fade-in"); }

  const speaker = document.getElementById("story-speaker");
  const replay  = document.getElementById("story-replay");

  if (!window.speechSynthesis) {
    if (speaker) speaker.textContent = "📄";
    setTimeout(() => {
      const narBox = document.getElementById("story-narration");
      if (narBox) {
        narBox.classList.add("story-narration-fadeout");
        setTimeout(_revealTask, 600);
      } else {
        _revealTask();
      }
    }, 3000);
    return;
  }

  window.speechSynthesis.cancel();
  if (speaker) speaker.classList.add("speaking");

  const utter   = new SpeechSynthesisUtterance(_storyData.text);
  utter.rate    = Math.max(0.78, 1.0 - difficulty * 0.018);
  utter.pitch   = 1.05;
  utter.volume  = 1.0;

  const onDone = () => {
    if (speaker) { speaker.classList.remove("speaking"); speaker.textContent = "🔊"; }
    if (replay)  replay.classList.remove("hidden");
    setTimeout(() => {
      const narBox = document.getElementById("story-narration");
      if (narBox) {
        narBox.classList.add("story-narration-fadeout");
        setTimeout(_revealTask, 600);
      } else {
        _revealTask();
      }
    }, 1800);
  };
  utter.onend   = onDone;
  utter.onerror = onDone;

  if (replay) {
    replay.classList.add("hidden");
    replay.onclick = () => {
      window.speechSynthesis.cancel();
      const u2 = new SpeechSynthesisUtterance(_storyData.text);
      u2.rate = utter.rate; u2.pitch = utter.pitch; u2.volume = utter.volume;
      window.speechSynthesis.speak(u2);
    };
  }

  window.speechSynthesis.speak(utter);
}

function _revealTask() {
  const task = document.getElementById("story-task");
  if (!task) return;
  task.classList.remove("hidden");
  task.classList.add("fade-in");

  if (_storySubMode === "order") _buildOrderTask(task);
  else _buildQuestionTask(task);

  startMs = Date.now();
  startTimer();
}

function _buildOrderTask(container) {
  container.innerHTML = "";

  const prompt = document.createElement("p");
  prompt.className   = "story-task-prompt";
  prompt.textContent = "Drag the pictures into the correct order ↓";
  container.appendChild(prompt);

  const grid = document.createElement("div");
  grid.className = "story-order-grid";
  grid.id        = "story-order-grid";

  const scenes   = _storyData.scenes;
  const shuffled = [...scenes.keys()].sort(() => Math.random() - 0.5);

  shuffled.forEach(sceneIdx => {
    const scene = scenes[sceneIdx];
    const card  = document.createElement("div");
    card.className       = "story-scene-card";
    card.dataset.sceneIdx = sceneIdx;
    card.draggable        = true;
    card.innerHTML        = `<div class="scene-emoji">${scene.emoji}</div>
                            <div class="scene-drag-hint">⠿</div>`;
    card.addEventListener("dragstart", _onDragStart);
    card.addEventListener("dragover",  _onDragOver);
    card.addEventListener("drop",      _onDrop);
    card.addEventListener("dragend",   _onDragEnd);
    card.addEventListener("touchstart", _onTouchStart, { passive: true });
    card.addEventListener("touchmove",  _onTouchMove,  { passive: false });
    card.addEventListener("touchend",   _onTouchEnd);
    grid.appendChild(card);
  });

  container.appendChild(grid);

  const btn = document.createElement("button");
  btn.className   = "story-check-btn";
  btn.textContent = "✓ Check Order";
  btn.addEventListener("click", _checkOrder);
  container.appendChild(btn);
}

function _onDragStart(e) {
  _dragSrc = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}
function _onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  document.querySelectorAll(".story-scene-card").forEach(c => c.classList.remove("drag-over"));
  if (this !== _dragSrc) this.classList.add("drag-over");
}
function _onDrop(e) {
  e.preventDefault();
  if (this === _dragSrc) return;
  const grid  = document.getElementById("story-order-grid");
  const cards = [...grid.querySelectorAll(".story-scene-card")];
  const si    = cards.indexOf(_dragSrc);
  const di    = cards.indexOf(this);
  if (si < di) grid.insertBefore(_dragSrc, this.nextSibling);
  else         grid.insertBefore(_dragSrc, this);
  this.classList.remove("drag-over");
}
function _onDragEnd() {
  this.classList.remove("dragging");
  document.querySelectorAll(".story-scene-card").forEach(c => c.classList.remove("drag-over"));
}

function _onTouchStart(e) {
  _touchCard = this;
  const r = this.getBoundingClientRect();
  _touchClone = this.cloneNode(true);
  Object.assign(_touchClone.style, {
    position:"fixed", zIndex:"9999", opacity:"0.85", pointerEvents:"none",
    width:r.width+"px", height:r.height+"px", left:r.left+"px", top:r.top+"px",
    transform:"scale(1.05)", transition:"none"
  });
  document.body.appendChild(_touchClone);
  this.style.opacity = "0.3";
}
function _onTouchMove(e) {
  if (!_touchClone) return;
  e.preventDefault();
  const t = e.touches[0];
  _touchClone.style.left = (t.clientX - _touchClone.offsetWidth  / 2) + "px";
  _touchClone.style.top  = (t.clientY - _touchClone.offsetHeight / 2) + "px";
  _touchClone.style.display = "none";
  const under = document.elementFromPoint(t.clientX, t.clientY);
  _touchClone.style.display = "";
  document.querySelectorAll(".story-scene-card").forEach(c => c.classList.remove("drag-over"));
  const target = under?.closest(".story-scene-card");
  if (target && target !== _touchCard) target.classList.add("drag-over");
}
function _onTouchEnd(e) {
  if (!_touchClone) return;
  const t = e.changedTouches[0];
  _touchClone.remove(); _touchClone = null;
  if (_touchCard) _touchCard.style.opacity = "";
  document.querySelectorAll(".story-scene-card").forEach(c => c.classList.remove("drag-over"));
  _touchClone = null;
  const under  = document.elementFromPoint(t.clientX, t.clientY);
  const target = under?.closest(".story-scene-card");
  if (target && target !== _touchCard) {
    const grid  = document.getElementById("story-order-grid");
    const cards = [...grid.querySelectorAll(".story-scene-card")];
    const si    = cards.indexOf(_touchCard);
    const di    = cards.indexOf(target);
    if (si < di) grid.insertBefore(_touchCard, target.nextSibling);
    else         grid.insertBefore(_touchCard, target);
  }
  _touchCard = null;
}

function _checkOrder() {
  if (typeof firstClickMs !== "undefined" && !firstClickMs && startMs) firstClickMs = Date.now() - startMs;
  const grid   = document.getElementById("story-order-grid");
  if (!grid) return;
  const cards  = [...grid.querySelectorAll(".story-scene-card")];
  const player = cards.map(c => parseInt(c.dataset.sceneIdx));
  const correct = _storyData.scenes.map((_, i) => i);
  const ok = player.every((v, i) => v === correct[i]);

  if (ok) {
    cards.forEach(c => c.classList.add("scene-correct"));
    setTimeout(_storyWin, 500);
  } else {
    mistakes++;
    cards.forEach((c, i) => {
      if (parseInt(c.dataset.sceneIdx) !== correct[i]) {
        c.classList.add("scene-shake");
        setTimeout(() => c.classList.remove("scene-shake"), 600);
      }
    });
  }
}

function _buildQuestionTask(container) {
  container.innerHTML = "";

  const q = document.createElement("p");
  q.className   = "story-question-text";
  q.textContent = _storyData.question;
  container.appendChild(q);

  const choiceGrid = document.createElement("div");
  choiceGrid.className = "story-choices";

  _storyData.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className   = "story-choice-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => _checkAnswer(idx, btn, choiceGrid));
    choiceGrid.appendChild(btn);
  });

  container.appendChild(choiceGrid);
}

function _checkAnswer(chosen, btn, grid) {
  if (typeof firstClickMs !== "undefined" && !firstClickMs && startMs) firstClickMs = Date.now() - startMs;
  grid.querySelectorAll(".story-choice-btn").forEach(b => b.disabled = true);
  if (chosen === _storyData.answer) {
    btn.classList.add("choice-correct");
    setTimeout(_storyWin, 600);
  } else {
    mistakes++;
    btn.classList.add("choice-shake");
    setTimeout(() => {
      btn.classList.remove("choice-shake");
      grid.querySelectorAll(".story-choice-btn").forEach(b => b.disabled = false);
    }, 500);
  }
}

function _storyWin() {
  clearInterval(window.__t);
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const timeSec = startMs ? ((Date.now() - startMs) / 1000).toFixed(1) : "0.0";
  _statusEl().textContent = "Story solved! ✨";

  try { const chime = document.getElementById("chime"); if (chime) { chime.currentTime = 0; chime.play(); } } catch(e) {}

  const entry = { username, puzzle_type: "story", difficulty, completion_time: parseFloat(timeSec), mistakes, outcome: "win" };
  pushLeaderboard(entry);
  sendScoreToServer(entry);

  _resDiffEl().textContent     = difficulty;
  _resTimeEl().textContent     = timeSec;
  _resMistEl().textContent = mistakes;
  _overlayEl().classList.remove("hidden");
}