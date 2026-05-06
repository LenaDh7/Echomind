// ─── Elements ──────────────────────────────────────────────────────────────
const prestartSection = document.getElementById("prestart");
const gameSection     = document.getElementById("game");

const playerNameEl = document.getElementById("playername");
const puzzleEl     = document.getElementById("puzzle");
const diffEl       = document.getElementById("difficulty");
const statusEl     = document.getElementById("status");
const timerEl      = document.getElementById("timer");
const overlay      = document.getElementById("overlay");
const resDiff      = document.getElementById("res-diff");
const resTime      = document.getElementById("res-time");
const resMistakes  = document.getElementById("res-mistakes");
const continueBtn  = document.getElementById("continue-btn");
const retryBtn     = document.getElementById("retry-btn");
const giveupBtn    = document.getElementById("giveup-btn");
const logoutBtn    = document.getElementById("logout-btn");
const showStatsBtn = document.getElementById("show-stats");

const chime   = document.getElementById("chime");
const ambient = document.getElementById("ambient");
if (chime)   chime.volume  = 0.7;
if (ambient) ambient.volume = 0.0;

const muteBtnPre   = document.getElementById("mute-btn-pre");
const muteBtnGame  = document.getElementById("mute-btn-game");
const aboutBtnPre  = document.getElementById("about-btn-pre");
const aboutBtnGame = document.getElementById("about-btn-game");
const aboutOverlay = document.getElementById("about");
const aboutClose   = document.getElementById("close-about");
const resetBtn     = document.getElementById("reset-btn");

const startLevelInput = document.getElementById("start-level");
const levelDisplay    = document.getElementById("level-display");
const levelHint       = document.getElementById("level-hint");
const startBtn        = document.getElementById("start-btn");

const hostBtn   = document.getElementById("host-btn");
const joinBtn   = document.getElementById("join-btn");
const mpOverlay = document.getElementById("mp-overlay");
const mpContent = document.getElementById("mp-content");
const mpActions = document.getElementById("mp-actions");
const mpTitle   = document.getElementById("mp-title");

const openDashBtn  = document.getElementById("open-dashboard-btn");
const dashOverlay  = document.getElementById("dashboard-overlay");
const closeDashBtn = document.getElementById("close-dashboard");

// ─── State ─────────────────────────────────────────────────────────────────
let username      = PHP_USERNAME || "Witchlight";
let role          = PHP_ROLE     || "player";
let classroomCode = PHP_CLASSROOM_CODE || null;

let difficulty     = 0;
let startMs        = 0;
let mistakes       = 0;
let sequence       = [];
let playerIndex    = 0;
let flashing       = false;
let muted          = false;
let selectedPuzzle = "memory";

let roomCode    = null;
let isHost      = false;
let syncTimer   = null;
let playerReady = false;
let gameStarted = false;

const SKEY   = "echomind_local_progress_v1";
const LBOARD = "echomind_local_leaderboard_v1";

// ─── Shape Memory state ────────────────────────────────────────────────────
let shapeCards   = [];
let shapeFlipped = [];
let shapeLocked  = false;
let shapePairs   = 0;
let shapeMatched = 0;

// 28 distinct shapes — all SVG paths verified to render correctly.
// Self-intersecting polygons (bowtie, hourglass) have been replaced with
// non-intersecting equivalents so they don't appear blank on some renderers.
const SHAPES = [
    // ── Original 18 ──────────────────────────────────────────────────────
    { name:"circle",    color:"#4ade80", draw:s=>`<circle cx="50" cy="50" r="34" fill="${s.color}"/>` },
    { name:"triangle",  color:"#facc15", draw:s=>`<polygon points="50,14 88,82 12,82" fill="${s.color}"/>` },
    { name:"square",    color:"#22d3ee", draw:s=>`<rect x="16" y="16" width="68" height="68" rx="6" fill="${s.color}"/>` },
    { name:"diamond",   color:"#f472b6", draw:s=>`<polygon points="50,10 88,50 50,90 12,50" fill="${s.color}"/>` },
    { name:"star",      color:"#fb923c", draw:s=>`<polygon points="50,8 61,35 90,35 67,54 76,82 50,64 24,82 33,54 10,35 39,35" fill="${s.color}"/>` },
    { name:"hexagon",   color:"#c084fc", draw:s=>`<polygon points="50,10 86,30 86,70 50,90 14,70 14,30" fill="${s.color}"/>` },
    { name:"pentagon",  color:"#a3e635", draw:s=>`<polygon points="50,10 90,38 74,84 26,84 10,38" fill="${s.color}"/>` },
    { name:"crescent",  color:"#f9a8d4", draw:s=>`<path d="M50,15 A35,35 0 1,0 50,85 A22,22 0 1,1 50,15Z" fill="${s.color}"/>` },
    { name:"cross",     color:"#f87171", draw:s=>`<path d="M38,10 h24 v28 h28 v24 h-28 v28 h-24 v-28 h-28 v-24 h28 z" fill="${s.color}"/>` },
    { name:"heart",     color:"#fb7185", draw:s=>`<path d="M50,80 C50,80 10,52 10,28 A20,20 0 0,1 50,22 A20,20 0 0,1 90,28 C90,52 50,80 50,80Z" fill="${s.color}"/>` },
    { name:"arrow",     color:"#2dd4bf", draw:s=>`<polygon points="50,10 90,50 68,50 68,90 32,90 32,50 10,50" fill="${s.color}"/>` },
    { name:"lightning", color:"#fbbf24", draw:s=>`<polygon points="58,10 30,54 50,54 42,90 70,46 50,46" fill="${s.color}"/>` },
    { name:"droplet",   color:"#38bdf8", draw:s=>`<path d="M50,10 Q80,45 80,62 A30,30 0 0,1 20,62 Q20,45 50,10Z" fill="${s.color}"/>` },
    { name:"shield",    color:"#818cf8", draw:s=>`<path d="M50,10 L88,28 L88,58 Q88,80 50,92 Q12,80 12,58 L12,28 Z" fill="${s.color}"/>` },
    { name:"flower",    color:"#f59e0b", draw:s=>`<circle cx="50" cy="30" r="16" fill="${s.color}"/><circle cx="50" cy="70" r="16" fill="${s.color}"/><circle cx="30" cy="50" r="16" fill="${s.color}"/><circle cx="70" cy="50" r="16" fill="${s.color}"/><circle cx="50" cy="50" r="14" fill="${s.color}" opacity="0.7"/>` },
    { name:"eye",       color:"#6366f1", draw:s=>`<ellipse cx="50" cy="50" rx="40" ry="22" fill="${s.color}"/><circle cx="50" cy="50" r="14" fill="#1a0030"/><circle cx="44" cy="44" r="5" fill="rgba(255,255,255,0.9)"/>` },
    { name:"spiral",    color:"#f97316", draw:s=>`<path d="M50,50 m-2,0 a2,2 0 0,1 4,0 a6,6 0 0,1 -12,0 a12,12 0 0,1 24,0 a18,18 0 0,1 -36,0 a24,24 0 0,1 48,0" fill="none" stroke="${s.color}" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="${s.color}"/>` },
    { name:"clover",    color:"#34d399", draw:s=>`<circle cx="50" cy="32" r="18" fill="${s.color}"/><circle cx="68" cy="62" r="18" fill="${s.color}"/><circle cx="32" cy="62" r="18" fill="${s.color}"/><rect x="46" y="46" width="8" height="36" rx="4" fill="${s.color}"/>` },

    // ── 10 new shapes (all non-self-intersecting) ─────────────────────────
    { name:"octagon",     color:"#e879f9", draw:s=>`<polygon points="32,10 68,10 90,32 90,68 68,90 32,90 10,68 10,32" fill="${s.color}"/>` },
    // tag: a right-pointing pentagon (like a label/price tag)
    { name:"tag",         color:"#fde68a", draw:s=>`<polygon points="10,20 70,20 90,50 70,80 10,80" fill="${s.color}"/>` },
    // moon: large circle minus smaller offset circle, rendered as a path
    { name:"moon",        color:"#bef264", draw:s=>`<path d="M72,20 A36,36 0 1,0 72,80 A24,24 0 1,1 72,20Z" fill="${s.color}"/>` },
    // cloud: three overlapping circles with filled base rect
    { name:"cloud",       color:"#93c5fd", draw:s=>`<rect x="18" y="56" width="64" height="20" rx="4" fill="${s.color}"/><circle cx="36" cy="56" r="18" fill="${s.color}"/><circle cx="55" cy="46" r="22" fill="${s.color}"/><circle cx="73" cy="56" r="15" fill="${s.color}"/>` },
    // parallelogram: non-intersecting slanted quad
    { name:"parallelogram", color:"#a5f3fc", draw:s=>`<polygon points="28,18 88,18 72,82 12,82" fill="${s.color}"/>` },
    // trapezoid: wider top, narrower bottom
    { name:"trapezoid",   color:"#fda4af", draw:s=>`<polygon points="18,25 82,25 92,75 8,75" fill="${s.color}"/>` },
    // burst: 8-point star (non-self-intersecting, alternating radii)
    { name:"burst",       color:"#86efac", draw:s=>`<polygon points="50,8 58,38 82,18 62,42 92,50 62,58 82,82 58,62 50,92 42,62 18,82 38,58 8,50 38,42 18,18 42,38" fill="${s.color}"/>` },
    // kite: a proper kite shape
    { name:"kite",        color:"#f0abfc", draw:s=>`<polygon points="50,8 80,45 50,92 20,45" fill="${s.color}"/>` },
    // chevron: a right-pointing arrow/chevron
    { name:"chevron",     color:"#67e8f9", draw:s=>`<polygon points="10,15 60,15 90,50 60,85 10,85 40,50" fill="${s.color}"/>` },
    // semicircle: half circle flat on bottom
    { name:"semicircle",  color:"#fca5a5", draw:s=>`<path d="M15,55 A35,35 0 0,1 85,55 Z" fill="${s.color}"/><rect x="15" y="55" width="70" height="6" rx="3" fill="${s.color}"/>` },
];

function getShapePreviewMs(diff) {
    if (diff <= 1) return 10000;
    if (diff <= 3) return 20000;
    if (diff <= 5) return 30000;
    return 45000;
}

// ─── Init ──────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
    loadState();
    if (playerNameEl) playerNameEl.textContent = username;
    if (window.WitchlightParticles) WitchlightParticles.mount("particles");

    if (startLevelInput) {
        startLevelInput.value = difficulty;
        updateSliderUI(difficulty);
    }
    setTimeout(buildSliderMarkers, 150);

    try {
        if (ambient) {
            ambient.play().then(() => {
                const t0 = performance.now();
                (function ramp(t) {
                    const p = Math.min(1, (t - t0) / 3000);
                    ambient.volume = muted ? 0 : p * 0.35;
                    if (p < 1) requestAnimationFrame(ramp);
                })(t0);
            }).catch(() => {});
        }
    } catch(e) {}

    refreshBoards();
    if (role === 'teacher' && dashOverlay) loadDashboard();

    document.getElementById("stats-modal-close")?.addEventListener("click", () => {
        document.getElementById("stats-modal")?.classList.add("hidden");
    });
});

// ─── Puzzle cards ──────────────────────────────────────────────────────────
document.querySelectorAll(".puzzle-card:not(.locked)").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".puzzle-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPuzzle = card.dataset.puzzle;
        if (startLevelInput) updateSliderUI(startLevelInput.value);
    });
});

// ─── Slider ────────────────────────────────────────────────────────────────
function updateSliderUI(val) {
    const n = parseInt(val);
    if (levelDisplay) levelDisplay.textContent = n;
    if (levelHint) {
        if (selectedPuzzle === "shape") {
            if (n <= 1)      levelHint.textContent = "2×2 grid · 2 pairs · 10s preview";
            else if (n <= 3) levelHint.textContent = "4×2 grid · 4 pairs · 20s preview";
            else if (n <= 5) levelHint.textContent = "4×4 grid · 8 pairs · 30s preview";
            else if (n <= 7) levelHint.textContent = "6×4 grid · 12 pairs · 45s preview";
            else             levelHint.textContent = "6×6 grid · 18 pairs · 45s preview";
        } else {
            if (n < 3)      levelHint.textContent = "3×3 grid · Beginner";
            else if (n < 7) levelHint.textContent = "4×4 grid · Intermediate";
            else            levelHint.textContent = "5×5 grid · Advanced";
        }
    }
}

function buildSliderMarkers() {
    const slider  = document.getElementById("start-level");
    const markers = document.getElementById("slider-markers");
    if (!slider || !markers) return;
    markers.innerHTML = "";
    const thumbW = 20, total = 10, trackW = slider.offsetWidth;
    if (trackW === 0) { setTimeout(buildSliderMarkers, 100); return; }
    const usable = trackW - thumbW;
    for (let i = 0; i <= total; i++) {
        const s = document.createElement("span");
        s.textContent = i;
        s.style.left = ((i / total) * usable + (thumbW / 2)) + "px";
        markers.appendChild(s);
    }
}

if (startLevelInput) {
    startLevelInput.addEventListener("input", () => updateSliderUI(startLevelInput.value));
}
if (window.ResizeObserver && document.getElementById("start-level")) {
    new ResizeObserver(() => setTimeout(buildSliderMarkers, 50)).observe(document.getElementById("start-level"));
}

// ─── Start game ────────────────────────────────────────────────────────────
if (startBtn) {
    startBtn.addEventListener("click", () => {
        difficulty = parseInt(startLevelInput ? startLevelInput.value : 0);
        saveState();
        prestartSection.classList.add("hidden");
        gameSection.classList.remove("hidden");
        if (window.WitchlightParticles) WitchlightParticles.mount("particles-game");
        if (selectedPuzzle === "shape") startShapePuzzle();
        else startNewPuzzle();
    });
}

// ─── About / Mute / Reset ──────────────────────────────────────────────────
if (aboutBtnPre)  aboutBtnPre.addEventListener("click",  () => aboutOverlay.classList.remove("hidden"));
if (aboutBtnGame) aboutBtnGame.addEventListener("click", () => aboutOverlay.classList.remove("hidden"));
if (aboutClose)   aboutClose.addEventListener("click",   () => aboutOverlay.classList.add("hidden"));

function setMuted(m) {
    muted = m;
    const lbl = muted ? "🔈" : "🔊";
    [muteBtnPre, muteBtnGame].forEach(b => { if (b) b.textContent = lbl; });
    if (muted) { if (ambient) { ambient.volume = 0; ambient.pause(); } }
    else        { if (ambient) ambient.play(); }
}
[muteBtnPre, muteBtnGame].forEach(b => {
    if (b) b.addEventListener("click", () => setMuted(!muted));
});

if (resetBtn) resetBtn.addEventListener("click", () => {
    localStorage.removeItem(LBOARD);
    difficulty = 0; saveState();
    if (startLevelInput) { startLevelInput.value = 0; updateSliderUI(0); }
    alert("Progress cleared.");
});

if (logoutBtn) logoutBtn.addEventListener("click", () => { window.location.href = "logout.php"; });

const backBtn = document.getElementById("back-btn");
if (backBtn) backBtn.addEventListener("click", () => {
    clearInterval(window.__t);
    clearInterval(window.__countdown);
    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "";
    overlay.classList.add("hidden");
    statusEl.textContent = "";
    timerEl.textContent = "Time: 0.0s";
    startMs = 0;
    flashing = false;
    shapeFlipped = [];
    shapeLocked = false;
});

// ─── Local storage ─────────────────────────────────────────────────────────
function loadState() {
    try {
        const s = JSON.parse(localStorage.getItem(SKEY) || "{}");
        if (Number.isFinite(s.difficulty)) difficulty = s.difficulty;
    } catch {}
}
function saveState() { localStorage.setItem(SKEY, JSON.stringify({ username, difficulty })); }
function pushLeaderboard(entry) {
    const all = JSON.parse(localStorage.getItem(LBOARD) || "[]");
    all.push(entry);
    all.sort((a,b) => (b.difficulty - a.difficulty) || (a.completion_time - b.completion_time));
    while (all.length > 100) all.pop();
    localStorage.setItem(LBOARD, JSON.stringify(all));
    refreshBoards();
}

// ─── Give Up ───────────────────────────────────────────────────────────────
if (giveupBtn) giveupBtn.addEventListener("click", () => {
    clearInterval(window.__t);
    clearInterval(window.__countdown);
    const timeSec = startMs ? (Date.now() - startMs) / 1000 : 0;
    const entry = { username, puzzle_type: selectedPuzzle, difficulty, completion_time: timeSec, mistakes, outcome: "giveup" };
    pushLeaderboard(entry);
    sendScoreToServer(entry);
    difficulty = heuristicNext(difficulty, timeSec, mistakes);
    saveState();
    if (selectedPuzzle === "shape") startShapePuzzle();
    else startNewPuzzle();
});

// ─── Witchlight Memory ─────────────────────────────────────────────────────
function startNewPuzzle() {
    clearInterval(window.__t);
    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "";
    mistakes = 0; sequence = []; playerIndex = 0;
    startMs = 0;
    timerEl.textContent = "Time: 0.0s";

    let size = 3;
    if (difficulty >= 3 && difficulty < 7) size = 4;
    else if (difficulty >= 7) size = 5;

    puzzleEl.style.gridTemplateColumns = `repeat(${size}, var(--tile))`;
    const total = size * size;
    for (let i = 0; i < total; i++) {
        const t = document.createElement("div");
        t.className = "tile"; t.dataset.index = i;
        t.addEventListener("click", () => onTileClick(i, t));
        puzzleEl.appendChild(t);
    }

    const seqLen = 3 + Math.min(difficulty, 3) + (difficulty >= 7 ? 3 : difficulty >= 3 ? 1 : 0);
    for (let i = 0; i < seqLen; i++) sequence.push(Math.floor(Math.random() * total));

    diffEl.textContent = difficulty;
    flashSequence();
}

async function flashSequence() {
    flashing = true;
    statusEl.textContent = "Watch the pattern...";
    const tiles   = [...document.querySelectorAll(".tile")];
    const flashMs = Math.max(350, 650 - difficulty * 20);
    const gapMs   = Math.max(200, 300 - difficulty * 10);
    for (const idx of sequence) {
        const t = tiles[idx];
        t.classList.add("flash","on");
        await sleep(flashMs);
        t.classList.remove("flash","on");
        await sleep(gapMs);
    }
    statusEl.textContent = "Your turn — repeat the pattern.";
    flashing = false; playerIndex = 0;
    startMs = Date.now(); startTimer();
}

function onTileClick(i, tile) {
    if (flashing) return;
    if (sequence[playerIndex] === i) {
        tile.classList.add("on");
        setTimeout(() => tile.classList.remove("on"), 180);
        playerIndex++;
        if (playerIndex === sequence.length) onSolved();
    } else {
        mistakes++;
        tile.classList.add("bad");
        setTimeout(() => tile.classList.remove("bad"), 220);
    }
}

async function onSolved() {
    clearInterval(window.__t);
    const timeSec = ((Date.now() - startMs) / 1000).toFixed(1);
    statusEl.textContent = "Puzzle solved! ✨";
    try { if (chime) { chime.currentTime = 0; await chime.play(); } } catch(e) {}
    const entry = { username, puzzle_type: selectedPuzzle, difficulty, completion_time: parseFloat(timeSec), mistakes, outcome: "win" };
    pushLeaderboard(entry);
    sendScoreToServer(entry);
    resDiff.textContent = difficulty; resTime.textContent = timeSec; resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

if (continueBtn) continueBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    difficulty = heuristicNext(difficulty, parseFloat(resTime.textContent), parseInt(resMistakes.textContent));
    saveState();
    if (selectedPuzzle === "shape") startShapePuzzle();
    else startNewPuzzle();
});

if (retryBtn) retryBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    sendScoreToServer({ username, puzzle_type: selectedPuzzle, difficulty, completion_time: 0, mistakes, outcome: "retry" });
    if (selectedPuzzle === "shape") {
        startShapePuzzle();
    } else {
        playerIndex = 0; startMs = 0;
        timerEl.textContent = "Time: 0.0s";
        flashSequence();
    }
});

// ─── Shape Memory ──────────────────────────────────────────────────────────
function getShapeGrid(diff) {
    if (diff <= 1) return { cols: 2, rows: 2 };
    if (diff <= 3) return { cols: 4, rows: 2 };
    if (diff <= 5) return { cols: 4, rows: 4 };
    if (diff <= 7) return { cols: 6, rows: 4 };
    return              { cols: 6, rows: 6 };
}

function startShapePuzzle() {
    // Kill ALL running timers before doing anything else
    clearInterval(window.__t);
    clearInterval(window.__countdown);
    startMs = 0;
    timerEl.textContent = "Time: 0.0s";

    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "shape-grid";
    mistakes = 0; shapeFlipped = []; shapeLocked = false; shapeMatched = 0;

    const { cols, rows } = getShapeGrid(difficulty);
    shapePairs = (cols * rows) / 2;

    if (shapePairs > SHAPES.length) {
        statusEl.textContent = `Error: need ${shapePairs} shapes, only ${SHAPES.length} defined.`;
        return;
    }

    const chosen = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, shapePairs);
    const cardData = [];
    chosen.forEach((shape, pairIdx) => {
        cardData.push({ pairIdx, shape });
        cardData.push({ pairIdx, shape });
    });
    cardData.sort(() => Math.random() - 0.5);

    puzzleEl.style.gridTemplateColumns = `repeat(${cols}, var(--shape-tile))`;
    const maxW = Math.floor((window.innerWidth * 0.88) / cols) - 10;
    const maxH = Math.floor((window.innerHeight * 0.62) / rows) - 10;
    const tileSize = Math.max(44, Math.min(88, maxW, maxH));
    puzzleEl.style.setProperty("--shape-tile", tileSize + "px");

    shapeCards = cardData.map((data, i) => {
        const wrap  = document.createElement("div"); wrap.className = "shape-card";
        const inner = document.createElement("div"); inner.className = "shape-card-inner";
        const front = document.createElement("div"); front.className = "shape-card-front";
        front.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${data.shape.draw(data.shape)}</svg>`;
        const back  = document.createElement("div"); back.className = "shape-card-back";
        back.innerHTML = `<span class="card-back-rune">✦</span>`;
        inner.appendChild(front); inner.appendChild(back);
        wrap.appendChild(inner); puzzleEl.appendChild(wrap);
        const card = { id:i, pairIdx:data.pairIdx, shape:data.shape, el:wrap, inner, matched:false, faceUp:false };
        wrap.addEventListener("click", () => onShapeCardClick(card));
        return card;
    });

    diffEl.textContent = difficulty;

    // ── Reveal all cards face-up for the preview phase ──────────────────
    // We wait for TWO paint frames so every card element is fully laid out
    // before the CSS flip fires. previewEnd is captured INSIDE the callback
    // so the countdown reflects real elapsed time, not time including rAF lag.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Add previewing class — instant face-up, no transition
            shapeCards.forEach(c => {
                c.el.classList.add("previewing");
                c.faceUp = true;
            });

            // Capture previewEnd NOW, after the two frames have passed
            const previewMs  = getShapePreviewMs(difficulty);
            const previewEnd = Date.now() + previewMs;

            statusEl.textContent = `Memorise the pairs… (${previewMs / 1000}s)`;

            window.__countdown = setInterval(() => {
                const remaining = Math.ceil((previewEnd - Date.now()) / 1000);
                if (remaining > 0) statusEl.textContent = `Memorise the pairs… (${remaining}s)`;
                else clearInterval(window.__countdown);
            }, 250);

            setTimeout(() => {
                clearInterval(window.__countdown);
                statusEl.textContent = "Get ready…";

                // Staggered hide-wave
                const indices   = shapeCards.map((_, i) => i).sort(() => Math.random() - 0.5);
                const staggerMs = Math.min(55, 700 / shapeCards.length);
                indices.forEach((cardIdx, i) => {
                    setTimeout(() => {
                        const c = shapeCards[cardIdx];
                        if (!c.matched) { c.el.classList.remove("previewing"); c.faceUp = false; }
                    }, i * staggerMs);
                });

                // Start timer only after all cards are fully hidden
                const totalHideMs = shapeCards.length * staggerMs + 500;
                setTimeout(() => {
                    statusEl.textContent = `Find all ${shapePairs} pairs!`;
                    startMs = Date.now();
                    startTimer();
                }, totalHideMs);

            }, previewMs);
        });
    });
}

function onShapeCardClick(card) {
    if (shapeLocked || card.matched || card.faceUp || shapeFlipped.length >= 2) return;
    card.el.classList.add("revealed"); card.faceUp = true; shapeFlipped.push(card);
    if (shapeFlipped.length === 2) {
        shapeLocked = true;
        const [a, b] = shapeFlipped;
        if (a.pairIdx === b.pairIdx) {
            setTimeout(() => {
                a.el.classList.add("shape-matched"); b.el.classList.add("shape-matched");
                a.el.classList.remove("revealed"); b.el.classList.remove("revealed");
                a.matched = true; b.matched = true;
                shapeFlipped = []; shapeLocked = false; shapeMatched++;
                if (shapeMatched === shapePairs) onShapeSolved();
            }, 500);
        } else {
            mistakes++;
            a.el.classList.add("shape-wrong"); b.el.classList.add("shape-wrong");
            setTimeout(() => {
                a.el.classList.remove("revealed","shape-wrong"); b.el.classList.remove("revealed","shape-wrong");
                a.faceUp = false; b.faceUp = false; shapeFlipped = []; shapeLocked = false;
            }, 900);
        }
    }
}

async function onShapeSolved() {
    clearInterval(window.__t);
    const timeSec = ((Date.now() - startMs) / 1000).toFixed(1);
    statusEl.textContent = "All pairs found! ✨";
    try { if (chime) { chime.currentTime = 0; await chime.play(); } } catch(e) {}
    const entry = { username, puzzle_type: "shape", difficulty, completion_time: parseFloat(timeSec), mistakes, outcome: "win" };
    pushLeaderboard(entry); sendScoreToServer(entry);
    resDiff.textContent = difficulty; resTime.textContent = timeSec; resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

// ─── Timer / utils ─────────────────────────────────────────────────────────
function startTimer() {
    clearInterval(window.__t);
    window.__t = setInterval(() => {
        if (!startMs) return;
        timerEl.textContent = `Time: ${((Date.now() - startMs) / 1000).toFixed(1)}s`;
    }, 250);
}
function heuristicNext(d, t, m) {
    let dlt = 0;
    if (t <= 20 && m === 0) dlt = 1;
    else if (t >= 60 || m >= 4) dlt = -1;
    return Math.max(0, Math.min(10, d + dlt));
}
function fmt(v) { return v?.toFixed ? v.toFixed(2) : v; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function puzzleLabel(pt) { return pt === "shape" ? "🔷 Shape" : "🌙 Memory"; }

// ─── Leaderboard ───────────────────────────────────────────────────────────
async function fetchLeaderboardFromServer() {
    try { const res = await fetch("php/fetch_leaderboard.php"); if (!res.ok) return []; return await res.json(); }
    catch { return []; }
}
async function refreshBoards() {
    const local = JSON.parse(localStorage.getItem(LBOARD) || "[]");
    let server = [];
    try { server = await fetchLeaderboardFromServer(); } catch {}
    const global = [...server, ...local].sort((a,b) => b.difficulty - a.difficulty).slice(0,10);
    renderGlobal(global);
    renderUser(local.filter(r => r.username === username).slice(-10).reverse());
}
function renderGlobal(rows) {
    const tb = document.getElementById("global-body"); if (!tb) return; tb.innerHTML = "";
    (rows||[]).forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.username}</td><td>${puzzleLabel(r.puzzle_type)}</td><td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`;
        tb.appendChild(tr);
    });
}
function renderUser(rows) {
    const tb = document.getElementById("user-body"); if (!tb) return; tb.innerHTML = "";
    (rows||[]).forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${puzzleLabel(r.puzzle_type)}</td><td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`;
        tb.appendChild(tr);
    });
}

// ─── Score submit ──────────────────────────────────────────────────────────
async function sendScoreToServer(entry) {
    try {
        const body = new URLSearchParams({
            username: entry.username, puzzle_type: entry.puzzle_type || selectedPuzzle || "memory",
            difficulty: entry.difficulty, time: entry.completion_time,
            mistakes: entry.mistakes, outcome: entry.outcome, classroom_code: classroomCode || ""
        });
        await fetch("php/submit_score.php", { method:"POST", body });
    } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Stats Modal — Tabbed Charts ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const chartsRendered = { memory: false, shape: false, combined: false };
const CHART_COLORS = {
    memory: { line:"rgba(255,95,203,.9)",  fill:"rgba(255,95,203,.12)",  bar:"rgba(255,73,113,.6)",  barBorder:"rgba(255,73,113,.9)"  },
    shape:  { line:"rgba(100,200,255,.9)", fill:"rgba(100,200,255,.12)", bar:"rgba(74,222,128,.55)", barBorder:"rgba(74,222,128,.9)"  },
};
const chartScaleDefaults = {
    x: { ticks:{ color:"#cdb7e6", maxTicksLimit:6, font:{size:10} }, grid:{ color:"#2a1440" } },
    y: { ticks:{ color:"#cdb7e6", font:{size:10} },                  grid:{ color:"#2a1440" } }
};

if (showStatsBtn) {
    showStatsBtn.addEventListener("click", () => {
        const modal = document.getElementById("stats-modal");
        if (!modal) return;
        const wasHidden = modal.classList.contains("hidden");
        modal.classList.toggle("hidden");
        if (wasHidden) {
            const activeTab = document.querySelector(".stats-tab.active");
            if (activeTab) loadTabCharts(activeTab.dataset.tab);
        }
    });
}

document.addEventListener("click", e => {
    const tab = e.target.closest(".stats-tab");
    if (!tab) return;
    const tabId = tab.dataset.tab;
    document.querySelectorAll(".stats-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".stats-tab-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(`tab-panel-${tabId}`)?.classList.remove("hidden");
    loadTabCharts(tabId);
});

async function loadTabCharts(tabId) {
    if (chartsRendered[tabId]) return;
    let allData = [];
    try {
        const res = await fetch(`php/stats.php?username=${encodeURIComponent(username)}`);
        allData = await res.json();
        if (!Array.isArray(allData)) allData = [];
    } catch(e) { return; }
    if (tabId === "memory")        renderPuzzleCharts("memory",   allData.filter(r => r.puzzle_type === "memory"));
    else if (tabId === "shape")    renderPuzzleCharts("shape",    allData.filter(r => r.puzzle_type === "shape"));
    else if (tabId === "combined") renderCombinedCharts(allData);
    chartsRendered[tabId] = true;
}

function renderPuzzleCharts(type, data) {
    const pal = CHART_COLORS[type];
    const emptyEl = document.getElementById(`stats-empty-${type}`);
    if (!data || !data.length) { if (emptyEl) emptyEl.style.display = "block"; return; }
    if (emptyEl) emptyEl.style.display = "none";
    const labels = data.map((_, i) => i + 1);
    new Chart(document.getElementById(`chart-${type}-time`).getContext("2d"), {
        type:"line", data:{ labels, datasets:[{ data:data.map(r=>parseFloat(r.completion_time).toFixed(1)),
            borderColor:pal.line, backgroundColor:pal.fill, fill:true, tension:0.35, pointRadius:3, borderWidth:2 }]},
        options:{ responsive:true, plugins:{legend:{display:false}}, scales:chartScaleDefaults }
    });
    new Chart(document.getElementById(`chart-${type}-diff`).getContext("2d"), {
        type:"line", data:{ labels, datasets:[{ data:data.map(r=>parseInt(r.difficulty)),
            borderColor:pal.line, backgroundColor:pal.fill, fill:true, tension:0.35, pointRadius:3, borderWidth:2 }]},
        options:{ responsive:true, plugins:{legend:{display:false}}, scales:{
            x:chartScaleDefaults.x,
            y:{min:0,max:10,ticks:{color:"#cdb7e6",stepSize:1,font:{size:10}},grid:{color:"#2a1440"}}
        }}
    });
    new Chart(document.getElementById(`chart-${type}-mistakes`).getContext("2d"), {
        type:"bar", data:{ labels, datasets:[{ data:data.map(r=>parseInt(r.mistakes)),
            backgroundColor:pal.bar, borderColor:pal.barBorder, borderWidth:1, borderRadius:4 }]},
        options:{ responsive:true, plugins:{legend:{display:false}}, scales:chartScaleDefaults }
    });
    const outcomes = data.reduce((acc,r)=>{ acc[r.outcome]=(acc[r.outcome]||0)+1; return acc; },{});
    new Chart(document.getElementById(`chart-${type}-outcomes`).getContext("2d"), {
        type:"doughnut", data:{ labels:Object.keys(outcomes), datasets:[{
            data:Object.values(outcomes),
            backgroundColor:["rgba(255,95,203,.7)","rgba(201,44,255,.7)","rgba(255,73,113,.7)","rgba(100,200,255,.7)"],
            borderColor:"rgba(19,7,28,.8)", borderWidth:2
        }]},
        options:{ responsive:true, plugins:{legend:{position:"bottom",labels:{color:"#cdb7e6",font:{size:11},padding:10}}} }
    });
}

function renderCombinedCharts(allData) {
    const emptyEl = document.getElementById("stats-empty-combined");
    if (!allData || !allData.length) { if (emptyEl) emptyEl.style.display = "block"; return; }
    if (emptyEl) emptyEl.style.display = "none";
    const memRows   = allData.filter(r => r.puzzle_type === "memory");
    const shapeRows = allData.filter(r => r.puzzle_type === "shape");
    const maxLen    = Math.max(memRows.length, shapeRows.length, 1);
    const labels    = Array.from({ length: maxLen }, (_, i) => i + 1);
    function pad(arr, key, parse = parseFloat) {
        const vals = arr.map(r => parse(r[key]));
        while (vals.length < maxLen) vals.push(null);
        return vals;
    }
    const legendOpts = { display:true, position:"top", labels:{ color:"#cdb7e6", font:{size:11}, padding:12 } };
    new Chart(document.getElementById("chart-combined-time").getContext("2d"), {
        type:"line", data:{ labels, datasets:[
            { label:"🌙 Memory", data:pad(memRows,"completion_time"), borderColor:"rgba(255,95,203,.9)", fill:false, tension:0.35, pointRadius:3, borderWidth:2, spanGaps:true },
            { label:"🔷 Shape",  data:pad(shapeRows,"completion_time"), borderColor:"rgba(100,200,255,.9)", fill:false, tension:0.35, pointRadius:3, borderWidth:2, spanGaps:true }
        ]}, options:{ responsive:true, plugins:{legend:legendOpts}, scales:chartScaleDefaults }
    });
    new Chart(document.getElementById("chart-combined-diff").getContext("2d"), {
        type:"line", data:{ labels, datasets:[
            { label:"🌙 Memory", data:pad(memRows,"difficulty",parseInt), borderColor:"rgba(255,95,203,.9)", fill:false, tension:0.35, pointRadius:3, borderWidth:2, spanGaps:true },
            { label:"🔷 Shape",  data:pad(shapeRows,"difficulty",parseInt), borderColor:"rgba(100,200,255,.9)", fill:false, tension:0.35, pointRadius:3, borderWidth:2, spanGaps:true }
        ]}, options:{ responsive:true, plugins:{legend:legendOpts}, scales:{
            x:chartScaleDefaults.x,
            y:{min:0,max:10,ticks:{color:"#cdb7e6",stepSize:1,font:{size:10}},grid:{color:"#2a1440"}}
        }}
    });
    new Chart(document.getElementById("chart-combined-mistakes").getContext("2d"), {
        type:"bar", data:{ labels, datasets:[
            { label:"🌙 Memory", data:pad(memRows,"mistakes",parseInt), backgroundColor:"rgba(255,95,203,.6)", borderColor:"rgba(255,95,203,.9)", borderWidth:1, borderRadius:3 },
            { label:"🔷 Shape",  data:pad(shapeRows,"mistakes",parseInt), backgroundColor:"rgba(100,200,255,.55)", borderColor:"rgba(100,200,255,.9)", borderWidth:1, borderRadius:3 }
        ]}, options:{ responsive:true, plugins:{legend:legendOpts}, scales:chartScaleDefaults }
    });
    const outcomes = allData.reduce((acc,r)=>{ acc[r.outcome]=(acc[r.outcome]||0)+1; return acc; },{});
    new Chart(document.getElementById("chart-combined-outcomes").getContext("2d"), {
        type:"doughnut", data:{ labels:Object.keys(outcomes), datasets:[{
            data:Object.values(outcomes),
            backgroundColor:["rgba(255,95,203,.7)","rgba(201,44,255,.7)","rgba(255,73,113,.7)","rgba(100,200,255,.7)"],
            borderColor:"rgba(19,7,28,.8)", borderWidth:2
        }]},
        options:{ responsive:true, plugins:{legend:{position:"bottom",labels:{color:"#cdb7e6",font:{size:11},padding:10}}} }
    });
}

// ─── Multiplayer ───────────────────────────────────────────────────────────
function showMPOverlay(title, contentHTML, actionsHTML) {
    mpTitle.textContent = title; mpContent.innerHTML = contentHTML; mpActions.innerHTML = actionsHTML;
    mpOverlay.classList.remove("hidden");
}
function hideMPOverlay() { mpOverlay.classList.add("hidden"); }

async function hostGame() {
    const fd = new FormData(); fd.append("username", username); fd.append("puzzle", selectedPuzzle);
    try {
        const res = await fetch("php/create_room.php", { method:"POST", body:fd });
        const data = await res.json();
        if (data.error) { alert("Error: "+data.error); return; }
        roomCode = data.code; isHost = true; showLobbyUI(); startPolling();
    } catch(e) { alert("Connection failed."); }
}
function openJoinModal() {
    const content = `<p style="color:var(--muted);margin-bottom:8px;">Enter room code:</p>
        <input type="text" id="join-input-code" maxlength="6" style="font-size:1.6rem;text-align:center;letter-spacing:5px;text-transform:uppercase;width:100%;max-width:240px;padding:8px;border-radius:8px;border:2px solid var(--magenta-d);background:#0f0718;color:var(--magenta);"/>
        <p id="join-error" style="color:var(--error);height:18px;font-size:.85rem;margin-top:4px;"></p>`;
    const actions = `<button id="modal-join-confirm">Join</button><button id="modal-join-cancel" class="ghost">Cancel</button>`;
    showMPOverlay("Join Multiplayer", content, actions);
    setTimeout(() => document.getElementById("join-input-code")?.focus(), 100);
    document.getElementById("modal-join-confirm").addEventListener("click", () => {
        const val = document.getElementById("join-input-code").value.trim().toUpperCase();
        if (val.length < 6) { document.getElementById("join-error").textContent = "Code must be 6 characters"; return; }
        submitJoin(val);
    });
    document.getElementById("modal-join-cancel").addEventListener("click", hideMPOverlay);
}
async function submitJoin(codeIn) {
    const fd = new FormData(); fd.append("code", codeIn); fd.append("username", username);
    try {
        const res = await fetch("php/join_room.php", { method:"POST", body:fd });
        const data = await res.json();
        if (data.error) { document.getElementById("join-error").textContent = data.error; return; }
        roomCode = codeIn; isHost = false; showLobbyUI(); startPolling();
    } catch(e) { alert("Connection failed."); }
}
function showLobbyUI() {
    const content = `
        <div style="background:rgba(0,0,0,.3);padding:18px;border-radius:12px;margin-bottom:14px;">
            <p style="color:var(--muted);margin:0 0 4px;font-size:.8rem;text-transform:uppercase;letter-spacing:2px;">Room Code</p>
            <h1 style="color:var(--magenta);font-size:2.4rem;letter-spacing:8px;margin:0;font-family:monospace;cursor:pointer;" onclick="navigator.clipboard.writeText('${roomCode}');alert('Copied!');">${roomCode}</h1>
        </div>
        <div id="lobby-status" style="margin-bottom:10px;font-weight:600;">Waiting...</div>
        <div id="player-list" style="font-size:.95rem;background:rgba(255,255,255,.03);padding:10px;border-radius:8px;min-height:50px;"></div>`;
    showMPOverlay(isHost ? "Hosting Game" : "Joined Game", content, `<button id="mp-ready-btn" class="small">I'm Ready</button>`);
    document.getElementById("mp-ready-btn").addEventListener("click", sendReady);
}
async function sendReady() {
    const fd = new FormData(); fd.append("code", roomCode); fd.append("username", username);
    await fetch("php/check_ready.php", { method:"POST", body:fd });
    const btn = document.getElementById("mp-ready-btn");
    if (btn) { btn.textContent = "Waiting..."; btn.disabled = true; }
    playerReady = true;
}
function startPolling() { if (syncTimer) clearInterval(syncTimer); syncTimer = setInterval(syncState, 2000); }
async function syncState() {
    if (!roomCode) return;
    try {
        const data = await (await fetch(`php/sync_state.php?code=${roomCode}`)).json();
        if (data.error) { clearInterval(syncTimer); alert("Room error."); hideMPOverlay(); return; }
        const sd = document.getElementById("lobby-status"), ld = document.getElementById("player-list");
        if (sd && ld) {
            ld.innerHTML = `<p>${data.host||"Host"} ${data.readyHost?"✅":"..."}</p><p>${data.guest||"Guest (waiting)"} ${data.guest?(data.readyGuest?"✅":"..."):"" }</p>`;
            sd.textContent = data.gameStarted?"Game Starting!":data.bothReady?"Both Ready!":"Waiting...";
        }
        if (isHost && data.bothReady && !data.gameStarted && !gameStarted) {
            gameStarted = true;
            const seq = generateRandomSequence(difficulty||0);
            const fd = new FormData(); fd.append("code",roomCode); fd.append("state",JSON.stringify({sequence:seq,difficulty}));
            await fetch("php/update_state.php",{method:"POST",body:fd});
            const fd2 = new FormData(); fd2.append("code",roomCode);
            await fetch("php/start_game.php",{method:"POST",body:fd2});
        }
        if (data.gameStarted && data.sequence) { clearInterval(syncTimer); hideMPOverlay(); launchMPGame(data.sequence,data.difficulty); }
    } catch(e) {}
}
function generateRandomSequence(diff) {
    const size=diff>=7?5:diff>=3?4:3, total=size*size, seqLen=3+Math.min(diff,3)+(diff>=7?3:diff>=3?1:0);
    const arr=[]; for(let i=0;i<seqLen;i++) arr.push(Math.floor(Math.random()*total)); return arr;
}
function launchMPGame(serverSeq, serverDiff) {
    prestartSection.classList.add("hidden"); gameSection.classList.remove("hidden");
    if (window.WitchlightParticles) WitchlightParticles.mount("particles-game");
    difficulty=serverDiff||0; sequence=serverSeq;
    overlay.classList.add("hidden"); puzzleEl.innerHTML=""; puzzleEl.className=""; mistakes=0; playerIndex=0;
    let size=3; if(difficulty>=3&&difficulty<7)size=4; else if(difficulty>=7)size=5;
    puzzleEl.style.gridTemplateColumns=`repeat(${size},var(--tile))`;
    for(let i=0;i<size*size;i++){const t=document.createElement("div");t.className="tile";t.dataset.index=i;t.addEventListener("click",()=>onTileClick(i,t));puzzleEl.appendChild(t);}
    diffEl.textContent=difficulty;
    setTimeout(()=>flashSequence(),1000);
}
if (hostBtn) hostBtn.addEventListener("click", hostGame);
if (joinBtn) joinBtn.addEventListener("click", openJoinModal);

// ─── Teacher dashboard ─────────────────────────────────────────────────────
if (openDashBtn)  openDashBtn.addEventListener("click",  () => { dashOverlay.classList.remove("hidden"); loadDashboard(); });
if (closeDashBtn) closeDashBtn.addEventListener("click", () => dashOverlay.classList.add("hidden"));

async function loadDashboard() {
    try { const res=await fetch("php/get_classroom.php"); renderDashboard(await res.json()); }
    catch(e) { console.error("Dashboard load failed",e); }
}
function renderDashboard(data) {
    const noEl=document.getElementById("dash-no-classroom"), hasEl=document.getElementById("dash-classroom");
    if (!data.classroom) { noEl.style.display="block"; hasEl.style.display="none"; setupCreateClassroom(); return; }
    noEl.style.display="none"; hasEl.style.display="block";
    const code=data.classroom.classroom_code;
    document.getElementById("dash-code-display").textContent=code;
    const base=window.location.href.replace(/index\.php.*$/,"");
    const link=`${base}classroom.php?code=${code}`;
    const ld=document.getElementById("dash-link-display");
    ld.textContent=link;
    ld.onclick=()=>{ navigator.clipboard.writeText(link).then(()=>{ ld.textContent="✅ Copied!"; setTimeout(()=>ld.textContent=link,2000); }); };
    const rosterEl=document.getElementById("student-roster");
    if (!data.students||data.students.length===0) {
        rosterEl.innerHTML=`<p style="color:var(--muted);font-size:.86rem;">No students yet.</p>`;
    } else {
        rosterEl.innerHTML=data.students.map(s=>`
            <div class="roster-row">
                <span class="roster-name">👤 ${s.student_name}</span>
                <button class="ghost small remove-student-btn" data-name="${s.student_name}" data-code="${code}">Remove</button>
            </div>`).join("");
        document.querySelectorAll(".remove-student-btn").forEach(btn=>{
            btn.addEventListener("click",async()=>{
                const fd=new FormData(); fd.append("student_name",btn.dataset.name); fd.append("classroom_code",btn.dataset.code);
                await fetch("php/remove_student.php",{method:"POST",body:fd}); loadDashboard();
            });
        });
    }
    const scoresSection=document.getElementById("student-scores-section");
    const scoresList=document.getElementById("student-scores-list");
    if (data.scores&&Object.keys(data.scores).length>0) {
        scoresSection.style.display="block";
        scoresList.innerHTML=Object.entries(data.scores).map(([student,scores])=>`
            <div class="student-score-block">
                <div class="student-score-name">👤 ${student}</div>
                <table style="width:100%;font-size:.78rem;">
                    <thead><tr><th>Puzzle</th><th>Diff</th><th>Time</th><th>Mistakes</th><th>Result</th></tr></thead>
                    <tbody>${scores.map(sc=>`<tr><td>${puzzleLabel(sc.puzzle_type)}</td><td>${sc.difficulty}</td><td>${parseFloat(sc.completion_time).toFixed(1)}s</td><td>${sc.mistakes}</td><td>${sc.outcome}</td></tr>`).join("")}</tbody>
                </table>
            </div>`).join("");
    } else { scoresSection.style.display="none"; }
    setupAddStudent(code);
}
function setupCreateClassroom() {
    const btn=document.getElementById("create-classroom-btn");
    if (btn) btn.onclick=async()=>{
        const name=document.getElementById("classroom-name-input").value.trim()||"My Classroom";
        const fd=new FormData(); fd.append("classroom_name",name);
        const data=await (await fetch("php/create_classroom.php",{method:"POST",body:fd})).json();
        if (data.error){alert(data.error);return;} loadDashboard();
    };
}
function setupAddStudent(code) {
    const addBtn=document.getElementById("add-student-btn");
    const addInput=document.getElementById("new-student-input");
    const addErr=document.getElementById("add-student-error");
    if (!addBtn) return;
    addBtn.onclick=async()=>{
        const name=addInput?addInput.value.trim():"";
        if (!name){if(addErr)addErr.textContent="Please enter a name.";return;}
        const fd=new FormData(); fd.append("student_name",name); fd.append("classroom_code",code);
        const data=await(await fetch("php/add_student.php",{method:"POST",body:fd})).json();
        if(data.error){if(addErr)addErr.textContent=data.error;}
        else{if(addInput)addInput.value="";if(addErr)addErr.textContent="";loadDashboard();}
    };
    if(addInput) addInput.onkeydown=e=>{if(e.key==="Enter")addBtn.click();};
}