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
if (chime)   chime.volume   = 0.7;
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

let firstClickMs = 0;
let roomCode    = null;
const _sessionToken = typeof PHP_SESSION_TOKEN !== "undefined" ? PHP_SESSION_TOKEN : null;

function _releaseStudentSession() {
    if (role === "student" && classroomCode && _sessionToken && username) {
        const fd = new FormData();
        fd.append("action", "release");
        fd.append("classroom_code", classroomCode);
        fd.append("student_name", username);
        fd.append("token", _sessionToken);
        navigator.sendBeacon("php/student_session.php", fd);
    }
}
// Release when tab closes / navigates away
window.addEventListener("beforeunload", _releaseStudentSession);

// Heartbeat — keeps is_active alive while student is on the page.
// If browser closes without firing beforeunload heartbeat stops classroom.php will auto-clear is_active after 90s
function _sendHeartbeat() {
    if (role === "student" && classroomCode && _sessionToken && username) {
        const fd = new FormData();
        fd.append("student_name",   username);
        fd.append("classroom_code", classroomCode);
        fd.append("token",          _sessionToken);
        navigator.sendBeacon("php/heartbeat.php", fd);
    }
}
if (role === "student") {
    _sendHeartbeat(); // immediate on load
    setInterval(_sendHeartbeat, 30000); // every 30s
}
let isHost      = false;
let syncTimer   = null;
let playerReady = false;
let gameStarted = false;

const SKEY   = "echomind_local_progress_v1";
const LBOARD = "echomind_local_leaderboard_v1";

let shapeCards   = [];
let shapeFlipped = [];
let shapeLocked  = false;
let shapePairs   = 0;
let shapeMatched = 0;

const SHAPES = [
    { name:"circle",    color:"#4ade80", draw:s=>`<circle cx="50" cy="50" r="34" fill="${s.color}"/>` },
    { name:"triangle",  color:"#facc15", draw:s=>`<polygon points="50,14 88,82 12,82" fill="${s.color}"/>` },
    { name:"square",    color:"#22d3ee", draw:s=>`<rect x="16" y="16" width="68" height="68" rx="6" fill="${s.color}"/>` },
    { name:"diamond",   color:"#f472b6", draw:s=>`<polygon points="50,10 88,50 50,90 12,50" fill="${s.color}"/>` },
    { name:"star",      color:"#fb923c", draw:s=>`<polygon points="50,8 61,35 90,35 67,54 76,82 50,64 24,82 33,54 10,35 39,35" fill="${s.color}"/>` },
    { name:"hexagon",   color:"#c084fc", draw:s=>`<polygon points="50,10 86,30 86,70 50,90 14,70 14,30" fill="${s.color}"/>` },
    { name:"pentagon",  color:"#a3e635", draw:s=>`<polygon points="50,10 90,38 74,84 26,84 10,38" fill="${s.color}"/>` },
    { name:"crescent",  color:"#f9a8d4", draw:s=>`<defs><clipPath id="cp_c"><circle cx="50" cy="50" r="36"/></clipPath></defs><circle cx="50" cy="50" r="36" fill="${s.color}"/><circle cx="66" cy="40" r="28" fill="#0f0718" clip-path="url(#cp_c)"/>` },
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
];

function getShapePreviewMs(diff) {
    if (typeof PHP_ASSIGNED_PREP !== "undefined" && PHP_ASSIGNED_PREP !== null) return PHP_ASSIGNED_PREP * 1000;
    if (diff <= 1) return 10000;
    if (diff <= 3) return 20000;
    if (diff <= 5) return 30000;
    return 45000;
}

function fmt(v) { return (v?.toFixed ? v.toFixed(2) : v); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let _ambientStarted = false;
function tryStartAmbient() {
    if (_ambientStarted || muted || !ambient) return;
    ambient.play().then(() => {
        _ambientStarted = true;
        const t0 = performance.now();
        (function ramp(t) {
            const p = Math.min(1, (t - t0) / 3000);
            ambient.volume = muted ? 0 : p * 0.35;
            if (p < 1) requestAnimationFrame(ramp);
        })(t0);
    }).catch(() => {});
}
function startAmbientOnGesture() {
    const events = ["click", "keydown", "touchstart"];
    const handler = () => {
        if (_currentSound === "ambient" || !_currentSound) {
            tryStartAmbient();
        } else if (_currentSound !== "off") {
            const s = SOUNDS.find(s => s.id === _currentSound);
            if (s?.generate && !_noiseNode && !muted) playGeneratedNoise(s.generate);
        }
        const done = _ambientStarted || _noiseNode || _currentSound === "off";
        if (done) events.forEach(e => document.removeEventListener(e, handler));
    };
    events.forEach(e => document.addEventListener(e, handler, { once: false }));
}
function puzzleLabel(pt) { if (pt === "shape") return "🔷 Shape"; if (pt === "story") return "📖 Story"; return "🌙 Memory"; }

function heuristicNext(d, t, m) {
    let dlt = 0;
    if (t <= 20 && m === 0) dlt = 1;
    else if (t >= 60 || m >= 4) dlt = -1;
    return Math.max(0, Math.min(10, d + dlt));
}

function startTimer() {
    clearInterval(window.__t);
    window.__t = setInterval(() => {
        const s = ((Date.now() - startMs) / 1000).toFixed(1);
        timerEl.textContent = `Time: ${s}s`;
    }, 250);
}

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

async function fetchLeaderboardFromServer() {
    try {
        const res = await fetch("php/fetch_leaderboard.php");
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}
async function refreshBoards() {
    if (role === "student") { const b = document.getElementById("boards"); if (b) b.style.display = "none"; return; }
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

async function sendScoreToServer(entry) {
    try {
        const body = new URLSearchParams({
            username:       entry.username,
            puzzle_type:    entry.puzzle_type || selectedPuzzle || "memory",
            difficulty:     entry.difficulty,
            time:           entry.completion_time,
            mistakes:       entry.mistakes,
            outcome:        entry.outcome,
            classroom_code: classroomCode || "",
            reaction_time:  entry.reaction_time ?? (firstClickMs ? (firstClickMs / 1000).toFixed(2) : 0)
        });
        await fetch("php/submit_score.php", { method:"POST", body });
    } catch(e) {}
}

let chartsLoaded  = false;
let allStatsData  = [];
let activeStatTab = "memory";
let chartInstances = {};

document.querySelectorAll(".stats-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".stats-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeStatTab = btn.dataset.tab;
        renderChartsForTab(activeStatTab);
    });
});

if (showStatsBtn) {
    showStatsBtn.addEventListener("click", () => {
        const modal = document.getElementById("stats-modal");
        if (!modal) return;
        modal.classList.toggle("hidden");
        if (!modal.classList.contains("hidden") && !chartsLoaded) loadCharts();
    });
}

const chartDefaults = {
    responsive: true,
    plugins: { legend:{ display:false } },
    scales: {
        x: { ticks:{color:"#cdb7e6", maxTicksLimit:6, font:{size:10}}, grid:{color:"#2a1440"} },
        y: { ticks:{color:"#cdb7e6", font:{size:10}}, grid:{color:"#2a1440"} }
    }
};

function destroyCharts() {
    Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch(e){} });
    chartInstances = {};
}

function renderChartsForTab(tab) {
    const emptyEl  = document.getElementById("stats-empty");
    const filtered = tab === "combined" ? allStatsData : allStatsData.filter(r => r.puzzle_type === tab);
    destroyCharts();
    if (!filtered.length) { emptyEl.style.display = "block"; return; }
    emptyEl.style.display = "none";

    const labels   = filtered.map(r => r.created_at.slice(5,16));
    const times    = filtered.map(r => parseFloat(r.completion_time));
    const diffs    = filtered.map(r => parseInt(r.difficulty));
    const mistakes = filtered.map(r => parseInt(r.mistakes));
    const outcomes = filtered.reduce((acc, r) => { acc[r.outcome] = (acc[r.outcome]||0)+1; return acc; }, {});

    chartInstances["time"] = new Chart(document.getElementById("chart-time").getContext("2d"), {
        type:"line", data:{ labels, datasets:[{ data:times, borderColor:"rgba(255,95,203,.8)", backgroundColor:"rgba(255,95,203,.15)", fill:true, tension:.3, pointRadius:3 }] }, options:{ ...chartDefaults }
    });
    chartInstances["diff"] = new Chart(document.getElementById("chart-diff").getContext("2d"), {
        type:"bar", data:{ labels, datasets:[{ data:diffs, backgroundColor:"rgba(201,44,255,.6)", borderRadius:4 }] }, options:{ ...chartDefaults }
    });
    chartInstances["mistakes"] = new Chart(document.getElementById("chart-mistakes").getContext("2d"), {
        type:"bar", data:{ labels, datasets:[{ data:mistakes, backgroundColor:"rgba(255,73,113,.6)", borderRadius:4 }] }, options:{ ...chartDefaults }
    });
    chartInstances["outcomes"] = new Chart(document.getElementById("chart-outcomes").getContext("2d"), {
        type:"doughnut",
        data:{ labels: Object.keys(outcomes), datasets:[{ data: Object.values(outcomes), backgroundColor:["rgba(255,95,203,.7)","rgba(201,44,255,.7)","rgba(255,73,113,.7)","rgba(100,200,255,.7)"], borderColor:"rgba(19,7,28,.8)", borderWidth:2 }] },
        options:{ responsive:true, plugins:{ legend:{ position:"bottom", labels:{ color:"#cdb7e6", font:{size:11}, padding:10 } } } }
    });
}

async function loadCharts() {
    try {
        const res    = await fetch(`php/stats.php?username=${encodeURIComponent(username)}`);
        allStatsData = await res.json();
        chartsLoaded = true;
        const _sh = document.querySelector('#stats-modal h3'); if (_sh) _sh.textContent = `📊 ${username}'s Statistics`;
        activeStatTab = selectedPuzzle || "memory";
        document.querySelectorAll(".stats-tab-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.tab === activeStatTab);
        });
        renderChartsForTab(activeStatTab);
    } catch(e) { console.log("Charts load failed:", e); }
}

window.addEventListener("load", () => {
    loadState();
    if (playerNameEl) playerNameEl.textContent = username;
    if (window.WitchlightParticles) WitchlightParticles.mount("particles");

    if (role === "student") {
        const backBtnEl = document.getElementById("back-btn");
        if (backBtnEl) backBtnEl.style.display = "none";
        ["host-btn","join-btn","reset-btn"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }

    if (PHP_ASSIGNED_PUZZLE && PHP_ASSIGNED_DIFF !== null) {
        selectedPuzzle = PHP_ASSIGNED_PUZZLE;
        difficulty     = PHP_ASSIGNED_DIFF;

        const preActions = document.querySelector(".pre-actions");
        if (preActions) {
            ["host-btn","join-btn","reset-btn"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "none";
            });
        }
        const backBtnEl = document.getElementById("back-btn");
        if (backBtnEl) backBtnEl.style.display = "none";

        if (startLevelInput) startLevelInput.value = difficulty;
        updateSliderUI(difficulty);
        document.querySelectorAll(".puzzle-card").forEach(c => {
            c.classList.toggle("selected", c.dataset.puzzle === selectedPuzzle);
        });

        const hint = document.getElementById("level-hint");
        if (hint) hint.textContent = `Assigned by your teacher`;
        const startBtnEl = document.getElementById("start-btn");
        if (startBtnEl) {
            startBtnEl.textContent = "▶ Start My Puzzle";
            startBtnEl.style.animation = "pulse 1s ease infinite";
        }

        setTimeout(() => {
            if (typeof coop !== "undefined" && coop.active) return;
            prestartSection.classList.add("hidden");
            gameSection.classList.remove("hidden");
            if (window.WitchlightParticles) WitchlightParticles.mount("particles-game");
            if (selectedPuzzle === "shape")      startShapePuzzle();
            else if (selectedPuzzle === "story") window.startStoryPuzzle();
            else startNewPuzzle();
        }, 1500);

        if (startLevelInput) startLevelInput.disabled = true;

    } else {
        if (startLevelInput) {
            startLevelInput.value = difficulty;
            updateSliderUI(difficulty);
        }
        setTimeout(buildSliderMarkers, 150);
    }

    try {
        if (ambient && !muted && _currentSound === "ambient") {
            ambient.play().then(() => {
                _ambientStarted = true;
                const t0 = performance.now();
                (function ramp(t) {
                    const p = Math.min(1, (t - t0) / 3000);
                    ambient.volume = muted ? 0 : p * 0.35;
                    if (p < 1) requestAnimationFrame(ramp);
                })(t0);
            }).catch(() => {
                startAmbientOnGesture();
            });
        } else if (_currentSound !== "ambient" && _currentSound !== "off") {
            startAmbientOnGesture();
        }
    } catch(e) { startAmbientOnGesture(); }

    refreshBoards();
    if (role === 'teacher' && dashOverlay) loadDashboard();

    document.getElementById("stats-modal-close")?.addEventListener("click", () => {
        document.getElementById("stats-modal")?.classList.add("hidden");
    });
});

document.querySelectorAll(".puzzle-card:not(.locked)").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".puzzle-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPuzzle = card.dataset.puzzle;
        if (startLevelInput) updateSliderUI(startLevelInput.value);
    });
});

function updateSliderUI(val) {
    const n = parseInt(val);
    if (levelDisplay) levelDisplay.textContent = n;
    if (levelHint) {
        if (selectedPuzzle === "story") {
            const tier = n < 3 ? "Beginner" : n < 7 ? "Intermediate" : "Advanced";
            levelHint.textContent = `Level ${n} · ${tier} · listen & answer`;
        } else if (selectedPuzzle === "shape") {
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

if (startBtn) {
    startBtn.addEventListener("click", () => {
        difficulty = parseInt(startLevelInput ? startLevelInput.value : 0);
        saveState();
        prestartSection.classList.add("hidden");
        gameSection.classList.remove("hidden");
        if (window.WitchlightParticles) WitchlightParticles.mount("particles-game");
        if (selectedPuzzle === "shape")      startShapePuzzle();
        else if (selectedPuzzle === "story") window.startStoryPuzzle();
        else startNewPuzzle();
    });
}

if (aboutBtnPre)  aboutBtnPre.addEventListener("click",  () => aboutOverlay.classList.remove("hidden"));
if (aboutBtnGame) aboutBtnGame.addEventListener("click", () => aboutOverlay.classList.remove("hidden"));
if (aboutClose)   aboutClose.addEventListener("click",   () => aboutOverlay.classList.add("hidden"));

function setMuted(m) {
    muted = m;
    const lbl = muted ? "🔈" : "🔊";
    [muteBtnPre, muteBtnGame].forEach(b => { if (b) b.textContent = lbl; });
    if (muted) { if (ambient) { ambient.volume = 0; ambient.pause(); } }
    else        { tryStartAmbient(); if (ambient && !ambient.paused) ambient.volume = 0.35; }
}
[muteBtnPre, muteBtnGame].forEach(b => {
    if (b) b.addEventListener("click", () => openSettingsPanel());
});


const THEMES = [
    {
        id: "default",
        label: "✨ Default",
        vars: {
            "--bg0": "#0a0011", "--bg1": "#1a0823",
            "--text": "#f3eaff", "--muted": "#cdb7e6",
            "--magenta": "#ff5fcb", "--magenta-d": "#c92cff",
            "--tile-off": "#1e0e2b", "--tile-on1": "#ff5fcb", "--tile-on2": "#c92cff",
            "--error": "#ff4971",
            "--surface": "rgba(19,7,28,.86)",
            "--border": "rgba(255,95,203,.18)",
        }
    },
    {
        id: "light",
        label: "🌸 Blossom",
        vars: {
            "--bg0": "#f5eef8", "--bg1": "#ede0f5",
            "--text": "#2d1a3e", "--muted": "#7a5c99",
            "--magenta": "#c050a0", "--magenta-d": "#9a2080",
            "--tile-off": "#ddc8f0", "--tile-on1": "#e070c0", "--tile-on2": "#b040a0",
            "--error": "#e03060",
            "--surface": "rgba(240,228,252,.92)",
            "--border": "rgba(192,80,160,.22)",
        }
    },
    {
        id: "sage",
        label: "🌿 Sage",
        vars: {
            "--bg0": "#0d1a12", "--bg1": "#152a1c",
            "--text": "#d8f0e0", "--muted": "#7aaa88",
            "--magenta": "#4ecb7a", "--magenta-d": "#2e9a58",
            "--tile-off": "#1a2e20", "--tile-on1": "#4ecb7a", "--tile-on2": "#2e9a58",
            "--error": "#e05050",
            "--surface": "rgba(13,26,18,.88)",
            "--border": "rgba(78,203,122,.18)",
        }
    },
    {
        id: "dusk",
        label: "🌅 Dusk",
        vars: {
            "--bg0": "#1a0e05", "--bg1": "#2a1808",
            "--text": "#fff0d8", "--muted": "#c4956a",
            "--magenta": "#ff9944", "--magenta-d": "#e06820",
            "--tile-off": "#2a1a08", "--tile-on1": "#ff9944", "--tile-on2": "#e06820",
            "--error": "#ff4444",
            "--surface": "rgba(26,14,5,.88)",
            "--border": "rgba(255,153,68,.18)",
        }
    },
    {
        id: "ocean",
        label: "🌊 Ocean",
        vars: {
            "--bg0": "#020e18", "--bg1": "#051e30",
            "--text": "#d0f0ff", "--muted": "#5a9ab8",
            "--magenta": "#22bbee", "--magenta-d": "#0a88cc",
            "--tile-off": "#071828", "--tile-on1": "#22bbee", "--tile-on2": "#0a88cc",
            "--error": "#ff5566",
            "--surface": "rgba(2,14,24,.88)",
            "--border": "rgba(34,187,238,.18)",
        }
    },
    {
        id: "midnight",
        label: "🌑 Midnight",
        vars: {
            "--bg0": "#030508", "--bg1": "#080c18",
            "--text": "#c8cfe8", "--muted": "#545c80",
            "--magenta": "#7080f0", "--magenta-d": "#4050d0",
            "--tile-off": "#0e1228", "--tile-on1": "#7080f0", "--tile-on2": "#4050d0",
            "--error": "#e05060",
            "--surface": "rgba(3,5,8,.92)",
            "--border": "rgba(112,128,240,.18)",
        }
    },
];

const SOUNDS = [
    { id: "ambient",  label: "🎵 Ambient",    url: "ambient.wav",  loop: true  },
    { id: "brown",    label: "🟤 Brown Noise", url: null,           loop: true,  generate: "brown" },
    { id: "pink",     label: "🩷 Pink Noise",  url: null,           loop: true,  generate: "pink"  },
    { id: "rain",     label: "🌧 Rain",        url: null,           loop: true,  generate: "rain"  },
    { id: "off",      label: "🔇 Off",         url: null,           loop: false  },
];

let _currentTheme = "default";
let _currentSound = "ambient";
let _noiseNode    = null;
let _audioCtx     = null;

(function loadPrefs() {
    try {
        const prefs = JSON.parse(localStorage.getItem("echomind_prefs") || "{}");
        if (prefs.theme) applyTheme(prefs.theme, false);
        if (prefs.sound) _currentSound = prefs.sound;
        if (typeof prefs.muted === "boolean") muted = prefs.muted;
    } catch(e) {}
})();

function savePrefs() {
    localStorage.setItem("echomind_prefs", JSON.stringify({
        theme: _currentTheme,
        sound: _currentSound,
        muted: muted,
    }));
}

function applyTheme(id, save = true) {
    const theme = THEMES.find(t => t.id === id);
    if (!theme) return;
    _currentTheme = id;

    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    const applyBodyAndStyle = () => {
        if (document.body) {
            document.body.style.background =
                `radial-gradient(1200px 800px at 20% -10%, var(--bg1) 0%, var(--bg0) 60%)`;
        }
        let el = document.getElementById("theme-override-style");
        if (!el) { el = document.createElement("style"); el.id = "theme-override-style"; document.head.appendChild(el); }

    const T = window._themeT = {
        default: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#1a0823 0%,#0a0011 60%)",
            section: "rgba(19,7,28,.86)", card: "rgba(30,10,43,.6)", cardSel: "rgba(255,95,203,.12)",
            cardHov: "rgba(255,95,203,.08)", cardBorder: "rgba(255,95,203,.15)", cardBorderSel: "#ff5fcb",
            input: "#0f0718", inputBorder: "#2a1440", inputFocus: "#ff5fcb",
            board: "rgba(30,10,43,.4)", dash: "rgba(20,6,34,.97)", tile: "#1e0e2b",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#ff5fcb 0%,#c92cff 70%)",
            tileGlow: "rgba(255,95,203,.45)", tileBad: "rgba(255,73,113,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#1d0a27 0%,#1e0e2b 70%)",
            cardBack: "rgba(30,10,43,.85)", cardBackBorder: "rgba(255,95,203,.18)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#0d2b1a 0%,#071a10 70%)",
            shapeMatchGlow: "rgba(74,222,128,.35)", shapeMatchBorder: "rgba(74,222,128,.4)",
            row: "rgba(255,95,203,.07)", rowHov: "rgba(255,95,203,.12)",
        },
        light: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#ede0f5 0%,#f5eef8 60%)",
            section: "rgba(240,228,252,.92)", card: "rgba(220,205,240,.75)", cardSel: "rgba(192,80,160,.15)",
            cardHov: "rgba(192,80,160,.09)", cardBorder: "rgba(192,80,160,.22)", cardBorderSel: "#c050a0",
            input: "rgba(230,215,248,.9)", inputBorder: "rgba(192,80,160,.3)", inputFocus: "#c050a0",
            board: "rgba(215,200,238,.55)", dash: "rgba(240,228,252,.97)", tile: "#ddc8f0",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#e070c0 0%,#b040a0 70%)",
            tileGlow: "rgba(192,80,160,.5)", tileBad: "rgba(224,48,96,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#ede0f5 0%,#ddc8f0 70%)",
            cardBack: "rgba(225,210,245,.85)", cardBackBorder: "rgba(192,80,160,.25)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#d5f0e0 0%,#b8e8cc 70%)",
            shapeMatchGlow: "rgba(60,180,100,.35)", shapeMatchBorder: "rgba(60,180,100,.4)",
            row: "rgba(192,80,160,.07)", rowHov: "rgba(192,80,160,.14)",
        },
        sage: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#152a1c 0%,#0d1a12 60%)",
            section: "rgba(13,26,18,.88)", card: "rgba(20,40,26,.75)", cardSel: "rgba(78,203,122,.12)",
            cardHov: "rgba(78,203,122,.08)", cardBorder: "rgba(78,203,122,.18)", cardBorderSel: "#4ecb7a",
            input: "#0a1a0e", inputBorder: "#1a3a22", inputFocus: "#4ecb7a",
            board: "rgba(20,40,26,.5)", dash: "rgba(10,22,14,.97)", tile: "#1a2e20",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#4ecb7a 0%,#2e9a58 70%)",
            tileGlow: "rgba(78,203,122,.5)", tileBad: "rgba(224,80,80,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#1a3322 0%,#1a2e20 70%)",
            cardBack: "rgba(20,40,26,.9)", cardBackBorder: "rgba(78,203,122,.2)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#0a2a18 0%,#071a10 70%)",
            shapeMatchGlow: "rgba(78,203,122,.4)", shapeMatchBorder: "rgba(78,203,122,.45)",
            row: "rgba(78,203,122,.07)", rowHov: "rgba(78,203,122,.14)",
        },
        dusk: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#2a1808 0%,#1a0e05 60%)",
            section: "rgba(26,14,5,.88)", card: "rgba(40,22,8,.75)", cardSel: "rgba(255,153,68,.12)",
            cardHov: "rgba(255,153,68,.08)", cardBorder: "rgba(255,153,68,.18)", cardBorderSel: "#ff9944",
            input: "#1a0e05", inputBorder: "#3a2010", inputFocus: "#ff9944",
            board: "rgba(40,22,8,.5)", dash: "rgba(18,10,3,.97)", tile: "#2a1a08",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#ff9944 0%,#e06820 70%)",
            tileGlow: "rgba(255,153,68,.5)", tileBad: "rgba(255,68,68,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#301808 0%,#2a1a08 70%)",
            cardBack: "rgba(40,22,8,.9)", cardBackBorder: "rgba(255,153,68,.2)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#1a3010 0%,#0f2008 70%)",
            shapeMatchGlow: "rgba(74,222,128,.35)", shapeMatchBorder: "rgba(74,222,128,.4)",
            row: "rgba(255,153,68,.07)", rowHov: "rgba(255,153,68,.14)",
        },
        ocean: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#051e30 0%,#020e18 60%)",
            section: "rgba(2,14,24,.88)", card: "rgba(5,22,38,.75)", cardSel: "rgba(34,187,238,.12)",
            cardHov: "rgba(34,187,238,.08)", cardBorder: "rgba(34,187,238,.18)", cardBorderSel: "#22bbee",
            input: "#020e18", inputBorder: "#082840", inputFocus: "#22bbee",
            board: "rgba(5,22,38,.5)", dash: "rgba(2,10,20,.97)", tile: "#071828",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#22bbee 0%,#0a88cc 70%)",
            tileGlow: "rgba(34,187,238,.5)", tileBad: "rgba(255,85,102,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#082035 0%,#071828 70%)",
            cardBack: "rgba(5,22,38,.9)", cardBackBorder: "rgba(34,187,238,.2)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#052a38 0%,#031820 70%)",
            shapeMatchGlow: "rgba(34,187,238,.4)", shapeMatchBorder: "rgba(34,187,238,.45)",
            row: "rgba(34,187,238,.07)", rowHov: "rgba(34,187,238,.14)",
        },
        midnight: {
            bg: "radial-gradient(1200px 800px at 20% -10%,#080c18 0%,#030508 60%)",
            section: "rgba(3,5,8,.92)", card: "rgba(10,14,30,.75)", cardSel: "rgba(112,128,240,.12)",
            cardHov: "rgba(112,128,240,.08)", cardBorder: "rgba(112,128,240,.18)", cardBorderSel: "#7080f0",
            input: "#050810", inputBorder: "#141830", inputFocus: "#7080f0",
            board: "rgba(10,14,30,.5)", dash: "rgba(3,4,10,.97)", tile: "#0e1228",
            tileOn: "radial-gradient(120% 120% at 20% 10%,#7080f0 0%,#4050d0 70%)",
            tileGlow: "rgba(112,128,240,.5)", tileBad: "rgba(224,80,96,.9)",
            cardFront: "radial-gradient(135% 135% at 20% 10%,#141830 0%,#0e1228 70%)",
            cardBack: "rgba(10,14,30,.9)", cardBackBorder: "rgba(112,128,240,.2)",
            shapeMatch: "radial-gradient(135% 135% at 20% 10%,#0a1a2a 0%,#071018 70%)",
            shapeMatchGlow: "rgba(112,128,240,.4)", shapeMatchBorder: "rgba(112,128,240,.45)",
            row: "rgba(112,128,240,.07)", rowHov: "rgba(112,128,240,.14)",
        },
    };

    const v = T[id] || T.default;
    const t = theme.vars;

    el.textContent = `
        html, body {
            color: ${t["--text"]} !important;
            background: ${v.bg} !important;
        }
        section {
            background: ${v.section} !important;
        }
        /* ── Puzzle cards ── */
        .puzzle-card {
            background: ${v.card} !important;
            border-color: ${v.cardBorder} !important;
        }
        .puzzle-card .card-title { color: ${t["--text"]} !important; }
        .puzzle-card .card-desc  { color: ${t["--muted"]} !important; }
        .puzzle-card .card-lock  { color: ${t["--muted"]} !important; }
        .puzzle-card:hover:not(.locked) {
            background: ${v.cardHov} !important;
            border-color: ${v.cardBorderSel} !important;
        }
        .puzzle-card.selected {
            background: ${v.cardSel} !important;
            border-color: ${v.cardBorderSel} !important;
            box-shadow: 0 0 18px ${v.tileGlow} !important;
        }
        /* ── Witchlight tiles ── */
        .tile {
            background: radial-gradient(120% 120% at 20% 10%, #1d0a27 0%, ${t["--tile-off"]} 70%) !important;
        }
        .tile.on {
            background: ${v.tileOn} !important;
            box-shadow: 0 0 20px ${v.tileGlow}, inset 0 0 10px rgba(255,255,255,.12) !important;
        }
        .tile.flash { animation: themeFlash 650ms ease !important; }
        @keyframes themeFlash {
            0%   { background: ${t["--tile-off"]}; }
            30%  { background: ${v.tileOn}; box-shadow: 0 0 26px ${v.tileGlow}; }
            100% { background: ${t["--tile-off"]}; }
        }
        /* ── Shape memory cards ── */
        .shape-card-front {
            background: ${v.cardFront} !important;
        }
        .shape-card-back {
            background: ${v.cardBack} !important;
            border-color: ${v.cardBackBorder} !important;
        }
        .shape-card.revealed .shape-card-front {
            box-shadow: 0 0 16px ${v.tileGlow}, inset 0 -2px 0 rgba(255,255,255,.04) !important;
            border-color: rgba(${id==="light"?"192,80,160":"255,255,255"},.35) !important;
        }
        .shape-card.shape-matched .shape-card-front {
            background: ${v.shapeMatch} !important;
            box-shadow: 0 0 18px ${v.shapeMatchGlow}, inset 0 0 0 1.5px ${v.shapeMatchBorder} !important;
        }
        /* ── Inputs & selects ── */
        input:not([type=range]) {
            background: ${v.input} !important;
            color: ${t["--text"]} !important;
            border-color: ${v.inputBorder} !important;
        }
        input:not([type=range]):focus { border-color: ${v.inputFocus} !important; }
        select {
            background: ${v.input} !important;
            color: ${t["--text"]} !important;
            border-color: ${v.inputBorder} !important;
        }
        /* ── HUD & text ── */
        .hud { color: ${t["--muted"]} !important; }
        #status { color: ${t["--magenta"]} !important; }
        .hint, p.hint { color: ${t["--muted"]} !important; }
        .level-hint { color: ${t["--magenta"]} !important; }
        .level-value { color: ${t["--magenta"]} !important; }
        /* ── Leaderboard ── */
        #boards { background: ${v.board} !important; }
        th    { color: ${t["--muted"]} !important; }
        td    { color: ${t["--text"]} !important; }
        th, td { border-bottom-color: ${v.cardBorder} !important; }
        /* ── Buttons ── */
        button.ghost {
            color: ${t["--muted"]} !important;
            border-color: ${v.cardBorder} !important;
        }
        button.ghost:hover { color: ${t["--text"]} !important; }
        a.pre-logout-btn {
            color: ${t["--muted"]} !important;
            border-color: ${v.cardBorder} !important;
        }
        /* ── Dashboard / modals ── */
        .dashboard-box { background: ${v.dash} !important; color: ${t["--text"]} !important; }
        .stats-modal-box { background: ${v.dash} !important; color: ${t["--text"]} !important; }
        .mp-box { background: ${v.dash} !important; color: ${t["--text"]} !important; }
        #coop-wait-screen > div,
        #coop-summary-screen > div,
        #echomind-settings > div,
        #tapestry-preview-modal > div { background: ${v.dash} !important; }
        /* ── Slider ── */
        input[type=range]::-webkit-slider-runnable-track {
            background: linear-gradient(90deg, ${t["--magenta"]}, ${t["--magenta-d"]}) !important;
        }
        input[type=range]::-webkit-slider-thumb { background: ${t["--magenta"]} !important; }
        input[type=range]::-moz-range-track {
            background: linear-gradient(90deg, ${t["--magenta"]}, ${t["--magenta-d"]}) !important;
        }
        input[type=range]::-moz-range-thumb { background: ${t["--magenta"]} !important; }
        /* ── Student roster rows ── */
        .student-row { background: ${v.row} !important; }
        .student-row:hover { background: ${v.rowHov} !important; }

        /* ── Story puzzle ── */
        .story-narration {
            background: ${v.card} !important;
            border-color: ${v.cardBorder} !important;
        }
        .story-header { color: ${t["--text"]} !important; }
        .story-instruction { color: ${t["--muted"]} !important; }
        .story-mode-badge {
            background: ${v.cardSel} !important;
            border-color: ${v.cardBorderSel} !important;
            color: ${t["--magenta"]} !important;
        }
        .story-text { color: ${t["--text"]} !important; }
        .story-question-text { color: ${t["--text"]} !important; }
        .story-task-prompt { color: ${t["--muted"]} !important; }
        .story-choice-btn {
            background: ${v.card} !important;
            border-color: ${v.cardBorder} !important;
            color: ${t["--text"]} !important;
        }
        .story-choice-btn:hover {
            background: ${v.cardSel} !important;
            border-color: ${v.cardBorderSel} !important;
        }
        .story-choice-btn.choice-correct {
            background: rgba(74,222,128,.18) !important;
            border-color: rgba(74,222,128,.5) !important;
            color: #4ade80 !important;
        }
        .story-scene-card {
            background: ${v.card} !important;
            border-color: ${v.cardBorder} !important;
            color: ${t["--text"]} !important;
        }
        .story-scene-card:hover {
            border-color: ${v.cardBorderSel} !important;
            background: ${v.cardSel} !important;
        }
        .story-scene-card.scene-correct {
            border-color: rgba(74,222,128,.5) !important;
            background: rgba(74,222,128,.12) !important;
        }
        .story-check-btn {
            background: linear-gradient(180deg, ${t["--magenta"]}, ${t["--magenta-d"]}) !important;
        }
        /* Overlay / complete screen */
        .overlay-content {
            background: ${v.dash} !important;
            color: ${t["--text"]} !important;
            border-color: ${v.cardBorder} !important;
        }
        .overlay-content h2 { color: ${t["--magenta"]} !important; }
        .overlay-content p  { color: ${t["--muted"]}   !important; }
    `;



        if (save) savePrefs();
    };

    if (document.body) {
        applyBodyAndStyle();
    } else {
        document.addEventListener("DOMContentLoaded", applyBodyAndStyle, { once: true });
    }
}

function hexToRgb(hex) {
    if (!hex) return "255,95,203";
    const m = hex.replace("#","").match(/.{2}/g);
    if (!m) return "255,95,203";
    return m.map(x => parseInt(x,16)).join(",");
}

function stopNoise() {
    if (_noiseNode) { try { _noiseNode.stop(); } catch(e) {} _noiseNode = null; }
}

function makeNoiseBuffer(ctx, type) {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 30;
    const buffer     = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);

        if (type === "brown") {
            let last = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + 0.02 * white) / 1.02;
                data[i] = last * 3.5;
            }
            const fade = sampleRate * 2;
            for (let i = 0; i < fade; i++) {
                data[i] *= i / fade;
                data[bufferSize - 1 - i] *= i / fade;
            }
        } else if (type === "pink") {
            let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
            for (let i = 0; i < bufferSize; i++) {
                const w = Math.random() * 2 - 1;
                b0=.99886*b0+w*.0555179; b1=.99332*b1+w*.0750759;
                b2=.96900*b2+w*.1538520; b3=.86650*b3+w*.3104856;
                b4=.55000*b4+w*.5329522; b5=-.7616*b5-w*.0168980;
                data[i] = (b0+b1+b2+b3+b4+b5+b6+w*.5362) * 0.11;
                b6 = w * 0.115926;
            }
            const fade = sampleRate * 2;
            for (let i = 0; i < fade; i++) {
                data[i] *= i / fade;
                data[bufferSize - 1 - i] *= i / fade;
            }
        } else if (type === "rain") {
            let last = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + 0.012 * white) / 1.012;
                let drop = 0;
                if (Math.random() < 0.0008) {
                    const len = 30 + Math.floor(Math.random() * 40);
                    const amp = 0.08 + Math.random() * 0.12;
                    for (let j = 0; j < len && i + j < bufferSize; j++) {
                        data[i + j] += Math.sin(Math.PI * j / len) * amp;
                    }
                }
                data[i] += last * 1.6 + drop;
            }
            const fade = sampleRate * 2;
            for (let i = 0; i < fade; i++) {
                data[i] *= i / fade;
                data[bufferSize - 1 - i] *= i / fade;
            }
        }
    }
    return buffer;
}

function playGeneratedNoise(type) {
    stopNoise();
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (_audioCtx.state === "suspended") _audioCtx.resume();
        const buffer = makeNoiseBuffer(_audioCtx, type);
        const source = _audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop   = true;
        const gain = _audioCtx.createGain();
        gain.gain.value = muted ? 0 : 0.12;

        const filter = _audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        if (type === "brown") {
            filter.frequency.value = 400;
            filter.Q.value = 0.3;
            gain.gain.value = muted ? 0 : 0.22;
        } else if (type === "pink") {
            filter.frequency.value = 3500;
            filter.Q.value = 0.7;
            gain.gain.value = muted ? 0 : 0.10;
        } else if (type === "rain") {
            filter.frequency.value = 1400;
            filter.Q.value = 1.2;
            gain.gain.value = muted ? 0 : 0.14;
        }
        source.connect(filter);
        filter.connect(gain);
        gain.connect(_audioCtx.destination);
        source.start();
        _noiseNode = source;
        _noiseNode._gain = gain;
    } catch(e) { console.warn("Web Audio noise failed:", e); }
}

function applySound(id, save = true) {
    _currentSound = id;
    const sound = SOUNDS.find(s => s.id === id);
    if (!sound) return;

    stopNoise();
    if (ambient) { ambient.pause(); ambient.currentTime = 0; }
    _ambientStarted = false;

    if (id === "off") {
    } else if (sound.generate) {
        if (!muted) playGeneratedNoise(sound.generate);
    } else if (sound.url) {
        if (!muted) {
            _ambientStarted = false;
            tryStartAmbient();
        }
    }

    const lbl = muted ? "🔈" : "🔊";
    [muteBtnPre, muteBtnGame].forEach(b => { if (b) b.textContent = lbl; });
    if (save) savePrefs();
}

function setMuted(m) {
    muted = m;
    const lbl = muted ? "🔈" : "🔊";
    [muteBtnPre, muteBtnGame].forEach(b => { if (b) b.textContent = lbl; });
    if (muted) {
        if (ambient) { ambient.volume = 0; ambient.pause(); }
        if (_noiseNode?._gain) _noiseNode._gain.gain.value = 0;
    } else {
        if (_currentSound === "ambient") {
            tryStartAmbient();
            if (ambient && !ambient.paused) ambient.volume = 0.35;
        } else if (_currentSound !== "off" && SOUNDS.find(s=>s.id===_currentSound)?.generate) {
            const s = SOUNDS.find(s => s.id === _currentSound);
            if (!_noiseNode) playGeneratedNoise(s.generate);
            else if (_noiseNode._gain) _noiseNode._gain.gain.value = 0.18;
        }
    }
    savePrefs();
}

function openSettingsPanel() {
    document.getElementById("echomind-settings")?.remove();

    const panel = document.createElement("div");
    panel.id = "echomind-settings";
    panel.style.cssText = [
        "position:fixed","inset:0","background:rgba(6,0,15,.88)","backdrop-filter:blur(8px)",
        "z-index:400","display:flex","align-items:center","justify-content:center","padding:20px"
    ].join(";");

    const sel = (arr, current, key) => arr.map(item => `
        <button class="settings-choice ${item.id===current?"active":""}"
                data-key="${key}" data-val="${item.id}"
                style="flex:1;min-width:0;padding:8px 6px;font-size:.78rem;font-weight:600;
                        border-radius:10px;cursor:pointer;transition:all .2s;margin:2px;
                        ${item.id===current
                            ? "background:linear-gradient(180deg,var(--magenta),var(--magenta-d));color:#1a0823;border:none;"
                            : "background:rgba(255,255,255,.05);color:var(--muted);border:1px solid rgba(255,255,255,.1);"
                        }">
            ${item.label}
        </button>`
    ).join("");

    panel.innerHTML = `
        <div style="background:rgba(20,6,34,.97);border:1px solid var(--border);border-radius:20px;
                    padding:26px 28px;max-width:480px;width:100%;box-shadow:0 0 56px rgba(201,44,255,.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h3 style="color:var(--magenta);margin:0;font-size:1.1rem;">⚙️ Settings</h3>
                <button id="settings-close" class="ghost small" style="margin:0;">✕</button>
            </div>

            <div style="margin-bottom:20px;">
                <p style="color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Colour Theme</p>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${sel(THEMES, _currentTheme, "theme")}
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <p style="color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Background Sound</p>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${sel(SOUNDS, _currentSound, "sound")}
                </div>
            </div>

            <div style="display:flex;align-items:center;gap:12px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);">
                <button id="settings-mute-btn" style="flex:1;margin:0;">${muted ? "🔇 Unmute" : "🔊 Mute"}</button>
                <span style="color:var(--muted);font-size:.8rem;">Sound is saved per account</span>
            </div>
        </div>`;

    document.body.appendChild(panel);

    panel.querySelectorAll(".settings-choice").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            const val = btn.dataset.val;
            if (key === "theme") applyTheme(val);
            if (key === "sound") applySound(val);
            // Refresh button states
            panel.querySelectorAll(`.settings-choice[data-key="${key}"]`).forEach(b => {
                const active = b.dataset.val === val;
                b.style.background = active
                    ? "linear-gradient(180deg,var(--magenta),var(--magenta-d))"
                    : "rgba(255,255,255,.05)";
                b.style.color  = active ? "#1a0823"        : "var(--muted)";
                b.style.border = active ? "none"           : "1px solid rgba(255,255,255,.1)";
            });
        });
    });

    document.getElementById("settings-mute-btn").addEventListener("click", () => {
        setMuted(!muted);
        document.getElementById("settings-mute-btn").textContent = muted ? "🔇 Unmute" : "🔊 Mute";
    });
    document.getElementById("settings-close").addEventListener("click", () => panel.remove());
    panel.addEventListener("click", e => { if (e.target === panel) panel.remove(); });
}

if (resetBtn) resetBtn.addEventListener("click", () => {
    localStorage.removeItem(LBOARD);
    difficulty = 0; saveState();
    if (startLevelInput) { startLevelInput.value = 0; updateSliderUI(0); }
    alert("Progress cleared.");
});

if (logoutBtn) {
    if (role === "student") {
        logoutBtn.textContent = "☰ Student List";
        logoutBtn.addEventListener("click", () => {
            window.location.href = "php/student_logout.php";
        });
    } else {
        logoutBtn.addEventListener("click", () => {
            window.location.href = "logout.php";
        });
    }
}

const backBtn = document.getElementById("back-btn");
if (backBtn) backBtn.addEventListener("click", () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window._storyPausedAmbient) {
        const amb = document.getElementById("ambient");
        if (amb) amb.play().catch(()=>{});
        window._storyPausedAmbient = false;
    }
    clearInterval(window.__t);
    clearInterval(window.__countdown);
    if (role === "student") { window.location.href = "php/student_logout.php"; return; }
    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "";
    overlay.classList.add("hidden");
    statusEl.textContent = "";
    timerEl.textContent = "Time: 0.0s";
    flashing = false;
    shapeFlipped = [];
    shapeLocked = false;
});

if (giveupBtn) giveupBtn.addEventListener("click", () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearInterval(window.__t);
    clearInterval(window.__countdown);
    firstClickMs = 0;
    mistakes = 0;
    if (selectedPuzzle === "shape")      startShapePuzzle();
    else if (selectedPuzzle === "story") window.startStoryPuzzle();
    else startNewPuzzle();
});

// Witchlight Memory
function startNewPuzzle() {
    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "";
    mistakes = 0; sequence = []; playerIndex = 0; firstClickMs = 0;

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

    document.getElementById("skip-flash-btn")?.remove();
    const skipBtn = document.createElement("button");
    skipBtn.id = "skip-flash-btn";
    skipBtn.textContent = "▶ Start Now";
    skipBtn.className = "ghost small";
    skipBtn.style.cssText = "margin:0;";
    const controls = document.querySelector(".controls");
    controls.insertBefore(skipBtn, document.getElementById("giveup-btn"));
    skipBtn.addEventListener("click", () => { flashing = false; });

    const tiles   = [...document.querySelectorAll(".tile")];
    const flashMs = Math.max(350, 650 - difficulty * 20);
    const gapMs   = Math.max(200, 300 - difficulty * 10);
    for (const idx of sequence) {
        if (!flashing) break;
        const t = tiles[idx];
        t.classList.add("flash","on");
        await sleep(flashMs);
        t.classList.remove("flash","on");
        await sleep(gapMs);
    }
    document.getElementById("skip-flash-btn")?.remove();
    statusEl.textContent = "Your turn — repeat the pattern.";
    flashing = false; playerIndex = 0;
    startMs = Date.now(); startTimer();
}

function onTileClick(i, tile) {
    if (flashing) return;
    if (!firstClickMs && startMs) firstClickMs = Date.now() - startMs;
    if (sequence[playerIndex] === i) {
        tile.classList.add("on");
        setTimeout(() => tile.classList.remove("on"), 180);
        playerIndex++;
        if (playerIndex === sequence.length) onSolved();
    } else {
        mistakes++;
        tile.classList.add("tile-shake");
        setTimeout(() => tile.classList.remove("tile-shake"), 400);
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

    resDiff.textContent     = difficulty;
    resTime.textContent     = timeSec;
    resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

if (continueBtn) continueBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    firstClickMs = 0;
    difficulty = heuristicNext(difficulty, parseFloat(resTime.textContent), parseInt(resMistakes.textContent));
    saveState();
    if (selectedPuzzle === "shape") startShapePuzzle();
    else if (selectedPuzzle === "story") window.startStoryPuzzle();
    else startNewPuzzle();
});

if (retryBtn) retryBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    sendScoreToServer({ username, puzzle_type: selectedPuzzle, difficulty, completion_time: 0, mistakes, outcome: "retry" });
    if (selectedPuzzle === "shape") {
        startShapePuzzle();
    } else if (selectedPuzzle === "story") {
        window.startStoryPuzzle();
    } else {
        playerIndex = 0; startMs = 0; firstClickMs = 0;
        timerEl.textContent = "Time: 0.0s";
        flashSequence();
    }
});

// Shape Memory
function getShapeGrid(diff) {
    if (diff <= 1) return { cols: 2, rows: 2 };
    if (diff <= 3) return { cols: 4, rows: 2 };
    if (diff <= 5) return { cols: 4, rows: 4 };
    if (diff <= 7) return { cols: 6, rows: 4 };
    return              { cols: 6, rows: 6 };
}

function startShapePuzzle() {
    clearInterval(window.__t);
    clearInterval(window.__countdown);

    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "shape-grid";
    mistakes     = 0;
    shapeFlipped = [];
    shapeLocked  = false;
    shapeMatched = 0;
    startMs      = 0;
    firstClickMs = 0;

    const { cols, rows } = getShapeGrid(difficulty);
    shapePairs = (cols * rows) / 2;

    const chosen   = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, shapePairs);
    const cardData = [];
    chosen.forEach((shape, pairIdx) => {
        cardData.push({ pairIdx, shape });
        cardData.push({ pairIdx, shape });
    });
    cardData.sort(() => Math.random() - 0.5);

    puzzleEl.style.gridTemplateColumns = `repeat(${cols}, var(--shape-tile))`;
    const maxW     = Math.floor((window.innerWidth  * 0.88) / cols) - 10;
    const maxH     = Math.floor((window.innerHeight * 0.62) / rows) - 10;
    const tileSize = Math.max(44, Math.min(88, maxW, maxH));
    puzzleEl.style.setProperty("--shape-tile", tileSize + "px");

    shapeCards = cardData.map((data, i) => {
        const wrap  = document.createElement("div"); wrap.className = "shape-card";
        const inner = document.createElement("div"); inner.className = "shape-card-inner";
        const front = document.createElement("div"); front.className = "shape-card-front";
        front.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${data.shape.draw(data.shape)}</svg>`;
        const back = document.createElement("div"); back.className = "shape-card-back";
        back.innerHTML = `<span class="card-back-rune">✦</span>`;
        inner.appendChild(front); inner.appendChild(back); wrap.appendChild(inner); puzzleEl.appendChild(wrap);
        const card = { id: i, pairIdx: data.pairIdx, shape: data.shape, el: wrap, inner, matched: false, faceUp: false };
        wrap.addEventListener("click", () => onShapeCardClick(card));
        return card;
    });

    diffEl.textContent = difficulty;

    requestAnimationFrame(() => {
        shapeCards.forEach(c => { c.el.classList.add("previewing"); c.faceUp = true; });
    });

    const previewMs  = getShapePreviewMs(difficulty);
    const previewEnd = Date.now() + previewMs;
    statusEl.textContent = `Memorise the pairs… (${previewMs / 1000}s)`;

    window.__countdown = setInterval(() => {
        const remaining = Math.ceil((previewEnd - Date.now()) / 1000);
        if (remaining > 0) statusEl.textContent = `Memorise the pairs… (${remaining}s)`;
        else clearInterval(window.__countdown);
    }, 250);

    document.getElementById("skip-flash-btn")?.remove();
    const skipShapeBtn = document.createElement("button");
    skipShapeBtn.id = "skip-flash-btn";
    skipShapeBtn.textContent = "▶ Start Now";
    skipShapeBtn.className = "ghost small";
    skipShapeBtn.style.cssText = "margin:0;";
    const controlsBar = document.querySelector(".controls");
    controlsBar.insertBefore(skipShapeBtn, document.getElementById("giveup-btn"));
    skipShapeBtn.addEventListener("click", () => {
        clearTimeout(window.__shapePreviewTimeout);
        clearInterval(window.__countdown);
        skipShapeBtn.remove();
        endShapePreview();
    });

    function endShapePreview() {
        const indices   = shapeCards.map((_, i) => i).sort(() => Math.random() - 0.5);
        const staggerMs = Math.min(55, 700 / shapeCards.length);
        statusEl.textContent = "Get ready…";
        indices.forEach((cardIdx, i) => {
            setTimeout(() => {
                const c = shapeCards[cardIdx];
                if (!c.matched) { c.el.classList.remove("previewing"); c.faceUp = false; }
            }, i * staggerMs);
        });
        setTimeout(() => {
            statusEl.textContent = `Find all ${shapePairs} pairs!`;
            startMs = Date.now();
            startTimer();
        }, shapeCards.length * staggerMs + 500);
    }

    window.__shapePreviewTimeout = setTimeout(() => {
        document.getElementById("skip-flash-btn")?.remove();
        clearInterval(window.__countdown);
        endShapePreview();
    }, previewMs);
}

function onShapeCardClick(card) {
    if (shapeLocked || card.matched || card.faceUp || shapeFlipped.length >= 2) return;
    if (!firstClickMs && startMs) firstClickMs = Date.now() - startMs;
    card.el.classList.add("revealed");
    card.faceUp = true;
    shapeFlipped.push(card);
    if (shapeFlipped.length === 2) {
        shapeLocked = true;
        const [a, b] = shapeFlipped;
        if (a.pairIdx === b.pairIdx) {
            setTimeout(() => {
                a.el.classList.add("shape-matched"); b.el.classList.add("shape-matched");
                a.matched = true; b.matched = true;
                shapeFlipped = []; shapeLocked = false; shapeMatched++;
                if (shapeMatched === shapePairs) onShapeSolved();
            }, 300);
        } else {
            mistakes++;
            setTimeout(() => {
                a.el.classList.remove("revealed"); b.el.classList.remove("revealed");
                a.faceUp = false; b.faceUp = false;
                shapeFlipped = []; shapeLocked = false;
            }, 900);
        }
    }
}

async function onShapeSolved() {
    clearInterval(window.__t);
    const timeSec = ((Date.now() - startMs) / 1000).toFixed(1);
    statusEl.textContent = "All pairs found! ✨";
    try { if (chime) { chime.currentTime = 0; await chime.play(); } } catch(e) {}
    const entry = { username, puzzle_type: selectedPuzzle, difficulty, completion_time: parseFloat(timeSec), mistakes, outcome: "win" };
    pushLeaderboard(entry); sendScoreToServer(entry);
    resDiff.textContent = difficulty; resTime.textContent = timeSec; resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

// Multiplayer
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
let _lobbyPuzzle = "memory";
let _lobbyDiff   = 5;

function showLobbyUI() {
    const pickerHTML = isHost ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
            <div>
                <p style="color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Puzzle</p>
                <select id="lobby-puzzle" style="width:100%;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                    <option value="memory">🌙 Witchlight</option>
                    <option value="shape">🔷 Shape Memory</option>
                    <option value="story">📖 Story Recall</option>
                </select>
            </div>
            <div>
                <p style="color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Difficulty</p>
                <select id="lobby-diff" style="width:100%;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                    ${[1,2,3,4,5,6,7,8,9,10].map(v => `<option value="${v}" ${v===5?"selected":""}>${v}</option>`).join("")}
                </select>
            </div>
        </div>` : `<p style="color:var(--muted);font-size:.85rem;margin-top:10px;">Waiting for host to set up the game…</p>`;

    const content = `
        <div style="background:rgba(0,0,0,.3);padding:14px 18px;border-radius:12px;margin-bottom:12px;">
            <p style="color:var(--muted);margin:0 0 4px;font-size:.78rem;text-transform:uppercase;letter-spacing:2px;">Room Code</p>
            <h1 style="color:var(--magenta);font-size:2.2rem;letter-spacing:8px;margin:0;font-family:monospace;cursor:pointer;"
                onclick="navigator.clipboard.writeText('${roomCode}');this.textContent='Copied!';setTimeout(()=>this.textContent='${roomCode}',1500);">${roomCode}</h1>
        </div>
        <div id="lobby-status" style="margin-bottom:8px;font-weight:600;font-size:.95rem;">Waiting…</div>
        <div id="player-list" style="font-size:.9rem;background:rgba(255,255,255,.03);padding:10px;border-radius:8px;min-height:44px;"></div>
        ${pickerHTML}`;

    const actions = `<button id="ready-btn">✅ Ready</button><button id="cancel-btn" class="ghost">Cancel</button>`;
    showMPOverlay(isHost ? "🎮 Hosting Room" : "🎮 Joined Room", content, actions);

    if (isHost) {
        document.getElementById("lobby-puzzle")?.addEventListener("change", e => { _lobbyPuzzle = e.target.value; });
        document.getElementById("lobby-diff")  ?.addEventListener("change", e => { _lobbyDiff   = parseInt(e.target.value); });
    }
    document.getElementById("ready-btn") ?.addEventListener("click", markReady);
    document.getElementById("cancel-btn")?.addEventListener("click", () => {
        clearInterval(syncTimer); hideMPOverlay();
        roomCode=null; isHost=false; gameStarted=false;
    });
}
async function markReady() {
    playerReady = true;
    document.getElementById("ready-btn").disabled = true;
    document.getElementById("ready-btn").textContent = "✅ Ready!";
    const fd = new FormData(); fd.append("code", roomCode); fd.append("username", username);
    await fetch("php/check_ready.php", { method:"POST", body:fd });
}
function startPolling() { clearInterval(syncTimer); syncTimer = setInterval(pollRoom, 1500); }
async function pollRoom() {
    try {
        const res = await fetch(`php/sync_state.php?code=${roomCode}`);
        const data = await res.json();
        if (data.error) { clearInterval(syncTimer); hideMPOverlay(); return; }
        const sd = document.getElementById("lobby-status"), ld = document.getElementById("player-list");
        if (sd && ld) {
            ld.innerHTML = `<p>${data.host||"Host"} ${data.readyHost?"✅":"..."}</p><p>${data.guest||"Guest (waiting)"} ${data.guest?(data.readyGuest?"✅":"..."):"" }</p>`;
            sd.textContent = data.gameStarted?"Game Starting!":data.bothReady?"Both Ready!":"Waiting...";
        }
        if (isHost && data.bothReady && !data.gameStarted && !gameStarted) {
            gameStarted = true;
            const initFd = new FormData();
            initFd.append("code",  roomCode);
            initFd.append("state", JSON.stringify({
                coopPuzzle: _lobbyPuzzle,
                coopDiff:   _lobbyDiff,
                roundOver:  false,
            }));
            await fetch("php/update_state.php", { method:"POST", body:initFd });
            setupRegularCoop(data, true);
            await startCoopRound();
        }
        if (data.gameStarted) {
            clearInterval(syncTimer);
            hideMPOverlay();
            if (!coop.active) setupRegularCoop(data, isHost);
            startCoopPoll();
        }
    } catch(e) {}
}

function setupRegularCoop(data, amHost) {
    const partnerName = amHost ? (data.guest || "Partner") : (data.host || "Partner");

    const puzzle = data.coopPuzzle || _lobbyPuzzle || "memory";
    const diff   = data.coopDiff   || _lobbyDiff   || 5;

    coop.active        = true;
    coop.roomCode      = roomCode;
    coop.iAmPlayerA    = amHost;
    coop.partnerName   = partnerName;
    coop.coopPuzzle    = puzzle;
    coop.coopDiff      = diff;
    coop.sceneTheme    = "space";
    coop.pairKey       = null;
    coop.roundNumber   = 0;
    coop.puzzleRunning = false;
    coop._readyThisRound   = true;
    coop._startedThisRound = false;

    selectedPuzzle = puzzle;
    difficulty     = diff;
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

// Teacher dashboard
if (openDashBtn)  openDashBtn.addEventListener("click",  () => { dashOverlay.classList.remove("hidden"); loadDashboard(); });
if (closeDashBtn) closeDashBtn.addEventListener("click", () => dashOverlay.classList.add("hidden"));

let _activeClassroomCode = null;

async function loadDashboard(code) {
    try {
        const url = code ? `php/get_classroom.php?code=${code}` : "php/get_classroom.php";
        const res = await fetch(url);
        const data = await res.json();
        if (data.classroom) _activeClassroomCode = data.classroom.classroom_code;
        renderDashboard(data);
    }
    catch(e) { console.error("Dashboard load failed",e); }
}

function renderDashboard(data) {
    const noEl=document.getElementById("dash-no-classroom"), hasEl=document.getElementById("dash-classroom");
    if (!data.classroom) { noEl.style.display="block"; hasEl.style.display="none"; setupCreateClassroom(); return; }
    noEl.style.display="none"; hasEl.style.display="block";
    _activeClassroomCode = data.classroom.classroom_code;
    const code = data.classroom.classroom_code;

    let switcherEl = document.getElementById("classroom-switcher");
    if (!switcherEl) {
        switcherEl = document.createElement("div");
        switcherEl.id = "classroom-switcher";
        switcherEl.style.cssText = "display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;";
        hasEl.insertBefore(switcherEl, hasEl.firstChild);
    }
    const opts = (data.classrooms||[data.classroom]).map(cl =>
        `<option value="${cl.classroom_code}" ${cl.classroom_code===code?"selected":""}>${cl.classroom_name}</option>`
    ).join("");
    switcherEl.innerHTML = `
        <select id="classroom-select" style="flex:1;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:7px 10px;font-family:inherit;font-size:.88rem;">${opts}</select>
        <button id="new-classroom-btn" class="small ghost" style="margin:0;white-space:nowrap;">+ New Classroom</button>`;
    document.getElementById("classroom-select").onchange = function() { loadDashboard(this.value); };
    document.getElementById("new-classroom-btn").onclick = () => {
        const name = prompt("Classroom name:", "New Classroom");
        if (!name) return;
        const fd = new FormData(); fd.append("classroom_name", name.trim());
        fetch("php/create_classroom.php",{method:"POST",body:fd}).then(r=>r.json()).then(d=>{ if(d.code) loadDashboard(d.code); });
    };

    document.getElementById("dash-code-display").textContent=code;
    const base=window.location.href.replace(/index\.php.*$/,"");
    const link=`${base}classroom.php?code=${code}`;
    const ld=document.getElementById("dash-link-display");
    ld.textContent=link;
    ld.onclick=()=>{ navigator.clipboard.writeText(link); ld.textContent="✅ Copied!"; setTimeout(()=>ld.textContent=link,2000); };

    const rosterEl=document.getElementById("student-roster");
    if (!data.students||data.students.length===0) {
        rosterEl.innerHTML=`<p style="color:var(--muted);font-size:.86rem;">No students yet.</p>`;
    } else {
        rosterEl.innerHTML = data.students.map(s => {
            const puzzle = s.assigned_puzzle || "memory";
            const diff   = s.assigned_difficulty ?? 0;
            return `
            <div class="roster-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="roster-name">👤 ${s.student_name} ${s.is_active ? '<span style="color:#4ade80;font-size:.75rem;">● online</span>' : ''}</span>
                    <button class="ghost small remove-student-btn" data-name="${s.student_name}" data-code="${code}" style="margin:0;">Remove</button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <select class="assign-puzzle-sel ghost small" data-name="${s.student_name}" data-code="${code}" style="flex:1;min-width:130px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:5px 8px;font-family:inherit;font-size:.8rem;">
                    <option value="memory" ${puzzle==="memory"?"selected":""}>🌙 Witchlight Memory</option>
                    <option value="shape"  ${puzzle==="shape" ?"selected":""}>🔷 Shape Memory</option>
                    <option value="story"  ${puzzle==="story" ?"selected":""}>📖 Story Recall</option>
                    </select>
                    <select class="assign-diff-sel ghost small" data-name="${s.student_name}" data-code="${code}" style="width:80px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:5px 8px;font-family:inherit;font-size:.8rem;">
                    ${Array.from({length:11},(_,i)=>`<option value="${i}" ${diff==i?"selected":""}>${i===0?"Lvl 0":"Lvl "+i}</option>`).join("")}
                    </select>
                    <select class="assign-prep-sel ghost small" data-name="${s.student_name}" data-code="${code}" title="Prep time" style="width:90px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:5px 8px;font-family:inherit;font-size:.8rem;">
                    ${[10,20,30,45,60,90,120].map(v=>`<option value="${v}" ${(s.assigned_prep_time??45)==v?"selected":""}>${v}s prep</option>`).join("")}
                    </select>
                    <button class="save-assign-btn small" data-name="${s.student_name}" data-code="${code}" style="margin:0;padding:5px 12px;font-size:.8rem;">Save</button>
                    <span class="assign-saved-msg" style="font-size:.75rem;color:#4ade80;display:none;">✓ Saved</span>
                </div>
            </div>`;
        }).join("");

        document.querySelectorAll(".remove-student-btn").forEach(btn=>{
            btn.addEventListener("click",async()=>{
                const fd=new FormData(); fd.append("student_name",btn.dataset.name); fd.append("classroom_code",btn.dataset.code);
                await fetch("php/remove_student.php",{method:"POST",body:fd}); loadDashboard(btn.dataset.code);
            });
        });

        document.querySelectorAll(".save-assign-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const name = btn.dataset.name, code = btn.dataset.code;
                const row  = btn.closest(".roster-row");
                const puzzle   = row.querySelector(".assign-puzzle-sel").value;
                const diff     = row.querySelector(".assign-diff-sel").value;
                const prepTime = row.querySelector(".assign-prep-sel")?.value ?? 45;
                const fd = new FormData();
                fd.append("student_name", name); fd.append("classroom_code", code);
                fd.append("puzzle", puzzle); fd.append("difficulty", diff); fd.append("prep_time", prepTime);
                const res  = await fetch("php/assign_student.php", {method:"POST",body:fd});
                const data = await res.json();
                if (data.ok) { const msg=row.querySelector(".assign-saved-msg"); msg.style.display="inline"; setTimeout(()=>msg.style.display="none",2000); }
            });
        });
    }

    renderStudentStatsTab(data, code);

    renderCoopPairsSection(data, code);
    setupAddStudent(code);
    setupDashTabs();
}

let _dashScores = {};
function renderStudentStatsTab(data, code) {
    _dashScores = data.scores || {};
    const listEl   = document.getElementById("stats-student-list");
    const detailEl = document.getElementById("stats-student-detail");
    if (!listEl || !detailEl) return;

    const students = (data.students || []).map(s => s.student_name);
    Object.keys(_dashScores).forEach(n => { if (!students.includes(n)) students.push(n); });

    if (students.length === 0) {
        listEl.innerHTML = `<p style="color:var(--muted);font-size:.86rem;">No students yet.</p>`;
        detailEl.innerHTML = "";
        return;
    }

    listEl.innerHTML = students.map(name => {
        const count = (_dashScores[name] || []).length;
        return `<button class="ghost small stats-student-btn" data-name="${name}"
                    style="margin:0;display:flex;align-items:center;gap:6px;">
                    👤 ${name}
                    <span style="font-size:.7rem;color:var(--muted);">${count ? count + " games" : "no games"}</span>
                </button>`;
    }).join("");

    detailEl.innerHTML = `<p style="color:var(--muted);font-size:.85rem;text-align:center;padding:14px 0;">Select a student above to view their stats.</p>`;

    listEl.querySelectorAll(".stats-student-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            listEl.querySelectorAll(".stats-student-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            showStudentStatDetail(btn.dataset.name);
        });
    });
}

function showStudentStatDetail(name) {
    const detailEl = document.getElementById("stats-student-detail");
    if (!detailEl) return;
    const scores = _dashScores[name] || [];

    if (scores.length === 0) {
        detailEl.innerHTML = `<p style="color:var(--muted);font-size:.86rem;text-align:center;padding:14px 0;">👤 ${name} hasn't played any puzzles yet.</p>`;
        return;
    }

    const total    = scores.length;
    const coopN    = scores.filter(s => Number(s.is_coop) === 1).length;
    const soloN    = total - coopN;
    const wins     = scores.filter(s => s.outcome === "win").length;
    const avgTime  = (scores.reduce((a,s)=>a+parseFloat(s.completion_time||0),0) / total).toFixed(1);
    const avgMist  = (scores.reduce((a,s)=>a+parseInt(s.mistakes||0),0) / total).toFixed(1);

    const summary = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:4px 0 12px;">
            ${statPill("Total", total)}
            ${statPill("Solo", soloN)}
            ${statPill("Co-op", coopN, "#c9a6ff")}
            ${statPill("Wins", wins, "#4ade80")}
            ${statPill("Avg time", avgTime + "s")}
            ${statPill("Avg mistakes", avgMist)}
        </div>`;

    const rows = scores.map(sc => {
        const coop = Number(sc.is_coop) === 1;
        const modeBadge = coop
            ? `<span style="font-size:.68rem;background:rgba(201,166,255,.16);color:#c9a6ff;border:1px solid rgba(201,166,255,.35);border-radius:20px;padding:1px 7px;">🤝 Co-op</span>`
            : `<span style="font-size:.68rem;background:rgba(255,255,255,.06);color:var(--muted);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:1px 7px;">Solo</span>`;
        const when = sc.created_at ? sc.created_at.replace("T"," ").slice(5,16) : "";
        const rt   = (sc.reaction_time > 0 && sc.reaction_time < 120) ? parseFloat(sc.reaction_time).toFixed(1)+"s" : "—";
        return `<tr>
            <td>${puzzleLabel(sc.puzzle_type)}</td>
            <td style="text-align:center">${modeBadge}</td>
            <td style="text-align:center">${sc.difficulty}</td>
            <td style="text-align:center">${parseFloat(sc.completion_time).toFixed(1)}s</td>
            <td style="text-align:center">${rt}</td>
            <td style="text-align:center">${sc.mistakes}</td>
            <td style="text-align:center">${sc.outcome}</td>
            <td style="text-align:right;color:var(--muted);font-size:.72rem;">${when}</td>
        </tr>`;
    }).join("");

    detailEl.innerHTML = `
        <div class="student-score-block">
            <div class="student-score-name">👤 ${name}</div>
            ${summary}
            <table style="width:100%;font-size:.78rem;">
                <thead><tr>
                    <th style="text-align:left;">Puzzle</th><th>Mode</th><th>Diff</th>
                    <th>Time</th><th>Start</th><th>Mistakes</th><th>Result</th><th style="text-align:right;">When</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

function statPill(label, value, color) {
    return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,95,203,.12);border-radius:10px;padding:6px 12px;text-align:center;min-width:64px;">
        <div style="font-size:1.05rem;font-weight:700;color:${color || "var(--text)"};">${value}</div>
        <div style="font-size:.66rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">${label}</div>
    </div>`;
}

function setupDashTabs() {
    const btns = document.querySelectorAll(".dash-tab-btn");
    btns.forEach(btn => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const tab = btn.dataset.dtab;
            document.getElementById("dash-panel-manage").style.display = tab === "manage" ? "block" : "none";
            document.getElementById("dash-panel-stats").style.display  = tab === "stats"  ? "block" : "none";
            // Co-op pairs section lives with Manage
            const coopSec = document.getElementById("coop-pairs-section");
            if (coopSec) coopSec.style.display = tab === "manage" ? "block" : "none";
        };
    });
}

const SCENE_THEMES = [
    { value:"space",   label:"🚀 Space" },
    { value:"forest",  label:"🌲 Forest" },
    { value:"ocean",   label:"🌊 Ocean" },
    { value:"castle",  label:"🏰 Castle" },
    { value:"volcano", label:"🌋 Volcano" },
];

function renderCoopPairsSection(data, code) {
    const old = document.getElementById("coop-pairs-section");
    if (old) old.remove();

    const students = data.students || [];
    const pairs    = data.coop_pairs || [];
    const hasEl    = document.getElementById("dash-panel-manage") || document.getElementById("dash-classroom");
    if (!hasEl) return;

    const sec = document.createElement("div");
    sec.id = "coop-pairs-section";
    sec.style.cssText = "margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,95,203,.15);";

    const partnerOf = {};
    students.forEach(s => { partnerOf[s.student_name] = s.assigned_coop_partner || null; });

    const pairsHTML = pairs.length === 0
        ? `<p style="color:var(--muted);font-size:.86rem;">No co-op pairs yet.</p>`
        : `<table style="width:100%;font-size:.8rem;margin-bottom:12px;">
            <thead><tr>
                <th style="text-align:left;">Player A</th>
                <th style="text-align:left;">Player B</th>
                <th>Puzzle</th><th>Diff</th><th>Theme</th><th>Rounds</th><th>Badges</th><th></th>
            </tr></thead>
            <tbody>${pairs.map(p => {
                const active = partnerOf[p.player_a] === p.player_b && partnerOf[p.player_b] === p.player_a;
                const dimStyle   = active ? "" : "opacity:.45;filter:grayscale(.6);";
                const labelStyle = active ? "color:var(--text);" : "color:var(--muted);text-decoration:line-through;";
                const statusBadge = active
                    ? `<span style="font-size:.7rem;background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3);border-radius:20px;padding:2px 7px;margin-left:6px;">paired</span>`
                    : `<span style="font-size:.7rem;background:rgba(255,255,255,.06);color:var(--muted);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:2px 7px;margin-left:6px;">unpaired</span>`;
                return `
                <tr style="${dimStyle}transition:opacity .3s;">
                    <td style="${labelStyle}">👤 ${p.player_a}${active ? "" : ""}</td>
                    <td style="${labelStyle}">👤 ${p.player_b}</td>
                    <td style="text-align:center">${p.coop_puzzle==='shape'?'🔷':p.coop_puzzle==='story'?'📖':'🌙'}</td>
                    <td style="text-align:center">${p.coop_difficulty ?? 5}</td>
                    <td style="text-align:center">${SCENE_THEMES.find(t=>t.value===p.scene_theme)?.label ?? p.scene_theme}</td>
                    <td style="text-align:center">${p.rounds_won}</td>
                    <td style="text-align:center">
                        <button class="ghost small tapestry-btn" style="margin:0;font-size:.78rem;padding:3px 9px;"
                                data-a="${p.player_a}" data-b="${p.player_b}"
                                data-rounds="${p.rounds_won}" data-badges="${p.badges_earned}"
                                data-theme="${p.scene_theme}" data-decs='${p.decorations_json || "[]"}'>
                            ${p.badges_earned} 🏅 👁
                        </button>
                    </td>
                    <td style="white-space:nowrap;">
                        ${statusBadge}
                        ${active
                            ? `<button class="ghost small unpair-btn" style="margin:0 0 0 4px;font-size:.75rem;" data-a="${p.player_a}" data-b="${p.player_b}" data-code="${code}">✕ Unpair</button>`
                            : `<button class="ghost small repair-btn" style="margin:0 0 0 4px;font-size:.75rem;opacity:.7;" data-a="${p.player_a}" data-b="${p.player_b}" data-puzzle="${p.coop_puzzle}" data-diff="${p.coop_difficulty ?? 5}" data-theme="${p.scene_theme}" data-code="${code}">↺ Re-pair</button>`
                        }
                    </td>
                </tr>`;
            }).join("")}</tbody>
        </table>`;

    const pairFormHTML = students.length < 2 ? `` : `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;">
            <select id="pair-student-a" style="flex:1;min-width:110px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                ${students.map(s=>`<option value="${s.student_name}">${s.student_name}</option>`).join("")}
            </select>
            <span style="color:var(--muted);font-size:.85rem;">+</span>
            <select id="pair-student-b" style="flex:1;min-width:110px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                ${students.map((s,i)=>`<option value="${s.student_name}" ${i===1?"selected":""}>${s.student_name}</option>`).join("")}
            </select>
            <select id="pair-puzzle" style="width:155px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                <option value="memory">🌙 Witchlight</option>
                <option value="shape">🔷 Shape Memory</option>
                <option value="story">📖 Story Recall</option>
            </select>
            <select id="pair-difficulty" title="Co-op difficulty (independent of each student's own level)" style="width:115px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                ${Array.from({length:11},(_,i)=>`<option value="${i}" ${i===5?"selected":""}>Co-op Lvl ${i}</option>`).join("")}
            </select>
            <select id="pair-theme" style="width:120px;background:#0f0718;color:var(--text);border:1px solid #3d2058;border-radius:8px;padding:6px 8px;font-family:inherit;font-size:.82rem;">
                ${SCENE_THEMES.map(t=>`<option value="${t.value}">${t.label}</option>`).join("")}
            </select>
            <button id="pair-save-btn" class="small" style="margin:0;">🤝 Pair</button>
            <span id="pair-save-msg" style="font-size:.75rem;color:#4ade80;display:none;">✓ Paired!</span>
        </div>`;

    sec.innerHTML = `
        <h4 style="color:var(--magenta);margin:0 0 10px;font-size:.9rem;">🤝 Co-op Pairs</h4>
        ${pairsHTML}
        ${pairFormHTML}`;

    hasEl.appendChild(sec);

    const pairSaveBtn = document.getElementById("pair-save-btn");
    if (pairSaveBtn) {
        pairSaveBtn.addEventListener("click", async () => {
            const a      = document.getElementById("pair-student-a").value;
            const b      = document.getElementById("pair-student-b").value;
            const theme  = document.getElementById("pair-theme").value;
            const puzzle = document.getElementById("pair-puzzle").value;
            const diff   = document.getElementById("pair-difficulty").value;
            if (a === b) { alert("Please select two different students."); return; }
            const fd = new FormData();
            fd.append("classroom_code", code);
            fd.append("student_a", a);
            fd.append("student_b", b);
            fd.append("scene_theme", theme);
            fd.append("coop_puzzle", puzzle);
            fd.append("coop_difficulty", diff);
            const res  = await fetch("php/pair_students.php", { method:"POST", body:fd });
            const resp = await res.json();
            if (resp.ok) {
                const msg = document.getElementById("pair-save-msg");
                msg.style.display = "inline";
                setTimeout(() => loadDashboard(code), 1200);
            } else {
                alert(resp.error || "Pairing failed");
            }
        });
    }

    sec.querySelectorAll(".unpair-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm(`Unpair ${btn.dataset.a} and ${btn.dataset.b}? Their round history will be kept.`)) return;
            for (const name of [btn.dataset.a, btn.dataset.b]) {
                const fd = new FormData();
                fd.append("student_name", name);
                fd.append("classroom_code", btn.dataset.code);
                fd.append("puzzle", "memory");
                fd.append("difficulty", 5);
                fd.append("prep_time", 45);
                fd.append("coop_partner", "");
                fd.append("coop_theme", "space");
                await fetch("php/assign_student.php", { method:"POST", body:fd });
            }
            loadDashboard(btn.dataset.code);
        });
    });

    sec.querySelectorAll(".repaire-btn, .repair-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const fd = new FormData();
            fd.append("classroom_code", btn.dataset.code);
            fd.append("student_a",      btn.dataset.a);
            fd.append("student_b",      btn.dataset.b);
            fd.append("coop_puzzle",    btn.dataset.puzzle);
            fd.append("coop_difficulty", btn.dataset.diff ?? 5);
            fd.append("scene_theme",    btn.dataset.theme);
            const res  = await fetch("php/pair_students.php", { method:"POST", body:fd });
            const resp = await res.json();
            if (resp.ok) loadDashboard(btn.dataset.code);
            else alert(resp.error || "Re-pairing failed");
        });
    });

    sec.querySelectorAll(".tapestry-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            let decs = [];
            try { decs = JSON.parse(btn.dataset.decs || "[]"); } catch(e) {}
            const badges = parseInt(btn.dataset.badges) || 0;
            if ((!decs || decs.length === 0) && badges > 0) {
                decs = Array.from({ length: Math.min(badges, 10) }, (_, i) => i);
            }
            showTapestryPreview({
                playerA: btn.dataset.a,
                playerB: btn.dataset.b,
                rounds:  parseInt(btn.dataset.rounds) || 0,
                badges:  badges,
                theme:   btn.dataset.theme || "space",
                decs:    decs,
            });
        });
    });
}

function showTapestryPreview({ playerA, playerB, rounds, badges, theme, decs }) {
    document.getElementById("tapestry-preview-modal")?.remove();

    const catalog = (typeof COOP_DECORATIONS !== "undefined" && COOP_DECORATIONS[theme])
                    ? COOP_DECORATIONS[theme]
                    : ["🌟","🪐","🚀","👾","🌙","☄️","🛸","🌌","🔭","🌠"];
    const emoji = { space:"🚀", forest:"🌲", ocean:"🌊", castle:"🏰", volcano:"🌋" }[theme] || "✨";
    const toNext = 5 - (rounds % 5);

    const slots = Array.from({ length: 10 }, (_, i) => {
        const unlocked = decs.includes(i);
        return `<div style="width:54px;height:54px;border-radius:12px;font-size:1.7rem;
            display:flex;align-items:center;justify-content:center;
            background:${unlocked ? "rgba(255,95,203,.18)" : "rgba(255,255,255,.04)"};
            border:1.5px solid ${unlocked ? "rgba(255,95,203,.55)" : "rgba(255,255,255,.07)"};
            ${unlocked ? "box-shadow:0 0 14px rgba(255,95,203,.25);" : ""}
        ">${unlocked ? catalog[i] : "✦"}</div>`;
    }).join("");

    const badgeRow = badges > 0
        ? Array.from({ length: badges }, () => `<span style="font-size:1.6rem;">🏅</span>`).join("")
        : `<span style="color:var(--muted);font-size:.85rem;">No badges yet · ${toNext} round${toNext!==1?"s":""} to first</span>`;

    const modal = document.createElement("div");
    modal.id = "tapestry-preview-modal";
    modal.style.cssText = [
        "position:fixed","inset:0","background:rgba(6,0,15,.88)",
        "display:flex","align-items:center","justify-content:center",
        "z-index:9999","padding:24px"
    ].join(";");

    modal.innerHTML = `
        <div style="background:rgba(34,11,52,.97);border:1px solid rgba(255,95,203,.25);
                    border-radius:20px;padding:28px 32px;max-width:440px;width:100%;
                    text-align:center;box-shadow:0 0 48px rgba(201,44,255,.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <h3 style="color:var(--magenta);margin:0;font-size:1.1rem;">${emoji} Tapestry Preview</h3>
                <button id="tapestry-close" class="ghost small" style="margin:0;">✕</button>
            </div>
            <p style="color:var(--text);margin:0 0 4px;font-weight:600;">👤 ${playerA} &nbsp;+&nbsp; 👤 ${playerB}</p>
            <p style="color:var(--muted);margin:0 0 18px;font-size:.9rem;">
                <strong style="color:var(--text);">${rounds}</strong> rounds won together
            </p>
            <div style="margin-bottom:18px;">
                <p style="color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Badges</p>
                <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;min-height:30px;">${badgeRow}</div>
            </div>
            <div>
                <p style="color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">
                    ${theme.charAt(0).toUpperCase()+theme.slice(1)} Tapestry · ${decs.length}/10
                </p>
                <div style="display:grid;grid-template-columns:repeat(5,54px);gap:8px;justify-content:center;">${slots}</div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    document.getElementById("tapestry-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

function setupCreateClassroom() {
    const btn=document.getElementById("create-classroom-btn");
    if (btn) btn.onclick=async()=>{
        const name=document.getElementById("classroom-name-input").value.trim()||"My Classroom";
        const fd=new FormData(); fd.append("classroom_name",name);
        const data=await (await fetch("php/create_classroom.php",{method:"POST",body:fd})).json();
        if (data.error){alert(data.error);return;} loadDashboard(data.code);
    };
    // Add another classroom button if teacher already has classrooms
    const hasEl = document.getElementById("dash-classroom");
    if (hasEl && hasEl.style.display !== "none") {
        const existing = document.getElementById("add-classroom-btn-row");
        if (!existing) {
            const row = document.createElement("div");
            row.id = "add-classroom-btn-row";
            row.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,95,203,.1);";
            row.innerHTML = `<input type="text" id="new-classroom-name" placeholder="New classroom name" style="flex:1;margin:0;max-width:none;"/>
                <button class="small" id="add-classroom-confirm" style="margin:0;">+ New Classroom</button>`;
            hasEl.appendChild(row);
            document.getElementById("add-classroom-confirm").onclick = async () => {
                const name = document.getElementById("new-classroom-name").value.trim() || "My Classroom";
                const fd = new FormData(); fd.append("classroom_name", name);
                const data = await (await fetch("php/create_classroom.php",{method:"POST",body:fd})).json();
                if (data.error){alert(data.error);return;}
                loadDashboard(data.code);
            };
        }
    }
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
        const data=await (await fetch("php/add_student.php",{method:"POST",body:fd})).json();
        if (data.error){if(addErr)addErr.textContent=data.error;return;}
        if(addInput)addInput.value=""; if(addErr)addErr.textContent=""; loadDashboard(code);
    };
}

const coop = {
    active:        false,
    roomCode:      null,
    pairKey:       null,
    partnerName:   null,
    iAmPlayerA:    false,
    sceneTheme:    "space",
    coopPuzzle:    "memory",
    coopDiff:      5,
    roundNumber:   0,
    myTurn:        false,
    pollTimer:     null,
    lastProgress:  null,
    _turnAdvanced: false,
    _readyThisRound: false,
    sharedSeq:     null,
    sharedCards:   null,
    sharedMatched: [],
    puzzleRunning: false,
};

const COOP_DECORATIONS = {
    space:   ["🌟","🪐","🚀","👾","🌙","☄️","🛸","🌌","🔭","🌠"],
    forest:  ["🌲","🦋","🍄","🦊","🌿","🌸","🐦","🍃","🌺","🦌"],
    ocean:   ["🐚","🐠","🌊","🐙","🦀","🐬","⚓","🌴","🐡","🦈"],
    castle:  ["🏰","⚔️","🛡️","👑","🔮","🗝️","🐉","🧙","💎","🏆"],
    volcano: ["🌋","🔥","💎","🦎","🌡️","⛏️","💀","🪨","🌪️","✨"],
};

function coopThemeEmoji(t) {
    return { space:"🚀", forest:"🌲", ocean:"🌊", castle:"🏰", volcano:"🌋" }[t] || "✨";
}

async function initCoopMode() {
    const partner = typeof PHP_COOP_PARTNER  !== "undefined" ? PHP_COOP_PARTNER  : null;
    if (!partner) return;

    const theme   = typeof PHP_COOP_THEME   !== "undefined" ? PHP_COOP_THEME   : "space";
    const puzzle  = typeof PHP_COOP_PUZZLE  !== "undefined" ? PHP_COOP_PUZZLE  : "memory";
    const diff    = (typeof PHP_ASSIGNED_DIFF !== "undefined" && PHP_ASSIGNED_DIFF !== null)
                    ? PHP_ASSIGNED_DIFF : 5;
    const clsCode = typeof PHP_CLASSROOM_CODE !== "undefined" ? PHP_CLASSROOM_CODE : null;

    coop.active      = true;
    coop.partnerName = partner;
    coop.sceneTheme  = theme;
    coop.coopPuzzle  = puzzle;
    coop.coopDiff    = diff;
    selectedPuzzle   = puzzle;
    difficulty       = diff;

    const names     = [username, partner].sort();
    coop.pairKey    = names[0] + "|" + names[1];
    coop.iAmPlayerA = (names[0] === username);

    ["host-btn","join-btn","reset-btn","back-btn"].forEach(id => {
        const el = document.getElementById(id); if (el) el.style.display = "none";
    });

    showCoopWait("Connecting…");

    if (coop.iAmPlayerA) {
        const fd = new FormData();
        fd.append("player_a",       username);
        fd.append("player_b",       partner);
        fd.append("pair_key",       coop.pairKey);
        fd.append("puzzle",         puzzle);
        fd.append("scene_theme",    theme);
        fd.append("classroom_code", clsCode || "");
        try {
            const res  = await fetch("php/create_coop_room.php", { method:"POST", body:fd });
            const data = await res.json();
            if (data.error) { showCoopWait("⚠️ " + data.error); return; }
            coop.roomCode = data.code;
            if (data.coopDifficulty !== undefined && data.coopDifficulty !== null) {
                coop.coopDiff = parseInt(data.coopDifficulty);
                difficulty    = coop.coopDiff;
            }
            if (data.coopPuzzle) {
                coop.coopPuzzle = data.coopPuzzle;
                selectedPuzzle  = data.coopPuzzle;
            }
            if (data.sceneTheme) coop.sceneTheme = data.sceneTheme;
        } catch(e) { showCoopWait("⚠️ Connection failed."); return; }
    } else {
        await waitForCoopRoom();
    }

    startCoopPoll();
}

async function waitForCoopRoom() {
    showCoopWait(`Waiting for ${coop.partnerName} to connect…`);
    return new Promise(resolve => {
        const t = setInterval(async () => {
            try {
                const url = `php/find_coop_room.php?partner=${encodeURIComponent(coop.partnerName)}&pair_key=${encodeURIComponent(coop.pairKey)}`;
                const res  = await fetch(url);
                const data = await res.json();
                if (data.code) {
                    clearInterval(t);
                    coop.roomCode = data.code;
                    const fd = new FormData();
                    fd.append("code",     coop.roomCode);
                    fd.append("username", username);
                    await fetch("php/join_room.php", { method:"POST", body:fd });
                    resolve();
                }
            } catch(e) {}
        }, 2000);
    });
}

function showCoopWait(msg, sub) {
    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    coop.puzzleRunning = false;

    let el = document.getElementById("coop-wait-screen");
    if (!el) {
        el = document.createElement("div");
        el.id = "coop-wait-screen";
        el.style.cssText = [
            "position:fixed","inset:0","background:rgba(6,0,15,.95)",
            "display:flex","flex-direction:column","align-items:center",
            "justify-content:center","z-index:500","gap:16px",
            "text-align:center","padding:28px"
        ].join(";");
        document.body.appendChild(el);
    }
    el.dataset.lobbyKey = "";
    el.innerHTML = `
        <div style="font-size:3rem;line-height:1;">${coopThemeEmoji(coop.sceneTheme)}</div>
        <h2 style="color:var(--magenta);margin:0;font-size:1.35rem;">Co-op Mode</h2>
        <p style="color:var(--text);margin:0;font-size:1rem;">${msg}</p>
        ${sub ? `<p style="color:var(--muted);margin:0;font-size:.88rem;">${sub}</p>` : ""}
        <div id="coop-wait-sub" style="color:var(--muted);font-size:.85rem;min-height:18px;"></div>
        <div style="width:36px;height:36px;border:3px solid rgba(255,95,203,.25);border-top-color:var(--magenta);border-radius:50%;animation:coopSpin 1s linear infinite;"></div>
        <style>@keyframes coopSpin{to{transform:rotate(360deg)}}</style>
    `;
}

function showCoopLobby(myReady, theirReady) {
    const key = `lobby:${myReady}:${theirReady}`;
    const el  = document.getElementById("coop-wait-screen");
    if (el && el.dataset.lobbyKey === key) return; // no change, don't flicker

    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    coop.puzzleRunning = false;

    let screen = el;
    if (!screen) {
        screen = document.createElement("div");
        screen.id = "coop-wait-screen";
        screen.style.cssText = [
            "position:fixed","inset:0","background:rgba(6,0,15,.95)",
            "display:flex","flex-direction:column","align-items:center",
            "justify-content:center","z-index:500","gap:16px",
            "text-align:center","padding:28px"
        ].join(";");
        document.body.appendChild(screen);
    }
    screen.dataset.lobbyKey = key;

    const puzzleLabel = coop.coopPuzzle === "shape" ? "🔷 Shape Memory"
                        : coop.coopPuzzle === "story" ? "📖 Story Recall"
                        : "🌙 Witchlight Memory";

    const readyBtnHTML = myReady
        ? `<button disabled style="opacity:.5;min-width:200px;">✅ Waiting for ${coop.partnerName}…</button>`
        : `<button id="coop-ready-btn" style="min-width:200px;">✅ I'm Ready!</button>`;

    screen.innerHTML = `
        <div style="font-size:2.8rem;">${coopThemeEmoji(coop.sceneTheme)}</div>
        <h2 style="color:var(--magenta);margin:0;font-size:1.35rem;">Co-op Mode</h2>
        <p style="color:var(--muted);margin:0;font-size:.9rem;">Round ${coop.roundNumber + 1} · ${puzzleLabel}</p>
        <div style="display:flex;gap:18px;justify-content:center;font-size:.95rem;
                    padding:12px 24px;background:rgba(255,255,255,.04);
                    border-radius:12px;border:1px solid rgba(255,95,203,.12);">
            <span>${myReady ? "✅" : "⬜"} You</span>
            <span style="color:var(--muted);">·</span>
            <span>${theirReady ? "✅" : "⬜"} ${coop.partnerName}</span>
        </div>
        ${readyBtnHTML}
        <p style="color:var(--muted);font-size:.8rem;margin:0;">Both players must be ready to start</p>
    `;

    const btn = document.getElementById("coop-ready-btn");
    if (btn && !coop._readyThisRound) {
        btn.addEventListener("click", async () => {
            coop._readyThisRound = true;
            btn.disabled = true;
            btn.textContent = `✅ Waiting for ${coop.partnerName}…`;
            const fd = new FormData();
            fd.append("code",     coop.roomCode);
            fd.append("username", username);
            await fetch("php/check_ready.php", { method:"POST", body:fd });
        });
    }

    if (myReady && theirReady && coop.iAmPlayerA && !coop._startedThisRound) {
        coop._startedThisRound = true;
        setTimeout(startCoopRound, 200);
    }
}

function hideCoopWait() {
    const el = document.getElementById("coop-wait-screen");
    if (el) el.remove();
    try {
        if (ambient && !muted && ambient.paused) {
            ambient.play().then(() => {
                const t0 = performance.now();
                (function ramp(t) {
                    const p = Math.min(1, (t - t0) / 2000);
                    ambient.volume = muted ? 0 : p * 0.35;
                    if (p < 1) requestAnimationFrame(ramp);
                })(t0);
            }).catch(() => {});
        }
    } catch(e) {}
}

function startCoopPoll() { clearInterval(coop.pollTimer); coop.pollTimer = setInterval(doCoopPoll, 900); doCoopPoll(); }
function stopCoopPoll()  { clearInterval(coop.pollTimer); coop.pollTimer = null; }

let coopPollInFlight  = false;   // prevents overlapping polls
let coopPollRequestId = 0;       // discards out-of-order responses

async function doCoopPoll() {
    if (!coop.roomCode) return;
    if (coopPollInFlight) return;
    coopPollInFlight = true;
    const myRequestId = ++coopPollRequestId;
    try {
        const res  = await fetch(`php/sync_state.php?code=${encodeURIComponent(coop.roomCode)}`);
        const data = await res.json();
        if (data.error) return;

        if (myRequestId !== coopPollRequestId) return;

        if (data.pairProgress) coop.lastProgress = data.pairProgress;

        if (data.pairDifficulty !== undefined && data.pairDifficulty !== null) {
            coop.coopDiff = parseInt(data.pairDifficulty);
        }
        if (data.pairPuzzle) {
            coop.coopPuzzle = data.pairPuzzle;
        }

        const bothPresent = !!(data.host && data.guest);
        const myReady     = coop.iAmPlayerA ? data.readyHost : data.readyGuest;
        const theirReady  = coop.iAmPlayerA ? data.readyGuest : data.readyHost;

        if (!bothPresent) {
            showCoopWait("Waiting for your partner…", `⏳ ${coop.partnerName} hasn't connected yet`);
            return;
        }

        if (!data.gameStarted) {
            showCoopLobby(myReady, theirReady);
            return;
        }

        coop.roundNumber = data.roundNumber ?? 0;
        const prevMyTurn = coop.myTurn;
        coop.myTurn      = (data.currentTurn === username);
        if (prevMyTurn !== coop.myTurn) {
            console.log(`[coop] turn changed → myTurn=${coop.myTurn} (server currentTurn=${data.currentTurn}, I am ${username})`);
        }

        if (data.roundOver && !document.getElementById("coop-summary-screen")) {
            stopCoopPoll();
            if (data.pairProgress) coop.lastProgress = data.pairProgress;
            showCoopSummary();
            return;
        }

        if (!coop.puzzleRunning && !data.roundOver
            && !document.getElementById("coop-summary-screen")) {
            launchCoopPuzzle(data);
            return;
        }

        if (coop.puzzleRunning) {
            applyRemoteState(data);
        }

        updateTurnIndicator();

    } catch(e) {
    } finally {
        coopPollInFlight = false;
    }
}

async function startCoopRound() {
    difficulty     = coop.coopDiff;
    selectedPuzzle = coop.coopPuzzle;

    let state = { roundOver: false, roundWon: false };

    if (coop.coopPuzzle === "memory") {
        let size = 3;
        if (difficulty >= 3 && difficulty < 7) size = 4;
        else if (difficulty >= 7) size = 5;
        const total  = size * size;
        const seqLen = 3 + Math.min(difficulty, 3) + (difficulty >= 7 ? 3 : difficulty >= 3 ? 1 : 0);
        const seq    = [];
        for (let i = 0; i < seqLen; i++) seq.push(Math.floor(Math.random() * total));
        state.sequence    = seq;
        state.gridSize    = size;
        state.playerIndex = 0;

    } else if (coop.coopPuzzle === "shape") {
        const { cols, rows } = getShapeGrid(difficulty);
        const pairs  = (cols * rows) / 2;
        const chosen = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, pairs);
        const cards  = [];
        chosen.forEach((shape, pairIdx) => {
            cards.push({ pairIdx, shapeName: shape.name, color: shape.color });
            cards.push({ pairIdx, shapeName: shape.name, color: shape.color });
        });
        cards.sort(() => Math.random() - 0.5);
        state.cards   = cards;
        state.cols    = cols;
        state.rows    = rows;
        state.matched = [];
        state.flipped = [];
    }

    const fd = new FormData();
    fd.append("code",         coop.roomCode);
    fd.append("game_started", 1);
    fd.append("current_turn", username);
    fd.append("round_number", coop.roundNumber);
    fd.append("pair_key",     coop.pairKey);
    fd.append("state",        JSON.stringify(state));
    await fetch("php/update_state.php", { method:"POST", body:fd });
}

function launchCoopPuzzle(data) {
    if (coop.puzzleRunning) return;
    coop.puzzleRunning = true;

    hideCoopWait();
    prestartSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    if (window.WitchlightParticles) WitchlightParticles.mount("particles-game");
    try {
        if (ambient && !muted && ambient.paused) {
            ambient.play().then(() => { ambient.volume = muted ? 0 : 0.35; }).catch(() => {});
        }
    } catch(e) {}

    difficulty     = coop.coopDiff;
    selectedPuzzle = coop.coopPuzzle;
    mistakes       = 0; firstClickMs = 0;
    diffEl.textContent = difficulty;
    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    puzzleEl.className = "";

    if (coop.coopPuzzle === "memory") {
        buildCoopMemoryGrid(data);
    } else if (coop.coopPuzzle === "shape") {
        buildCoopShapeGrid(data);
    }

    insertTurnBanner();
}

function insertTurnBanner() {
    document.getElementById("coop-turn-banner")?.remove();
    const banner = document.createElement("div");
    banner.id = "coop-turn-banner";
    banner.style.cssText = [
        "text-align:center","padding:6px 14px","border-radius:10px",
        "font-size:.88rem","font-weight:600","margin-bottom:6px",
        "transition:all .3s ease"
    ].join(";");
    const container = document.querySelector(".puzzle-container");
    if (container) container.parentNode.insertBefore(banner, container);
    updateTurnIndicator();
}

function updateTurnIndicator() {
    const banner = document.getElementById("coop-turn-banner");
    if (!banner) return;
    if (coop.myTurn) {
        banner.textContent = "🎮 Your turn!";
        banner.style.background = "rgba(255,95,203,.18)";
        banner.style.color = "var(--magenta)";
        banner.style.border = "1px solid rgba(255,95,203,.4)";
    } else {
        banner.textContent = `⏳ ${coop.partnerName}'s turn…`;
        banner.style.background = "rgba(255,255,255,.04)";
        banner.style.color = "var(--muted)";
        banner.style.border = "1px solid rgba(255,255,255,.08)";
    }
}

let coopSeq       = [];
let coopGridSize  = 3;
let coopPlayerIdx = 0;
let coopRevealed  = [];
let coopLastMirrorSig = null;

function buildCoopMemoryGrid(data) {
    let derivedSize = 3;
    if (coop.coopDiff >= 3 && coop.coopDiff < 7) derivedSize = 4;
    else if (coop.coopDiff >= 7) derivedSize = 5;

    const state = {
        sequence:    data.sequence,
        gridSize:    data.gridSize    ?? derivedSize,
        playerIndex: data.playerIndex ?? 0,
    };

    coopSeq       = state.sequence   || [];
    coopGridSize  = state.gridSize   || derivedSize;
    coopPlayerIdx = state.playerIndex || 0;
    coopRevealed  = data.revealed || [];
    coopLastMirrorSig = null;

    const size = coopGridSize;
    puzzleEl.style.gridTemplateColumns = `repeat(${size}, var(--tile))`;

    for (let i = 0; i < size * size; i++) {
        const t = document.createElement("div");
        t.className     = "tile";
        t.dataset.index = i;
        t.addEventListener("click", () => onCoopTileClick(i, t));
        puzzleEl.appendChild(t);
    }

    statusEl.textContent = "Watch the pattern…";
    startMs = Date.now(); startTimer();

    flashCoopSequence();
}

async function flashCoopSequence() {
    flashing = true;
    const tiles   = [...document.querySelectorAll(".tile")];
    const flashMs = Math.max(350, 650 - difficulty * 20);
    const gapMs   = Math.max(200, 300 - difficulty * 10);
    for (const idx of coopSeq) {
        if (!flashing) break;
        const t = tiles[idx];
        t.classList.add("flash", "on");
        await sleep(flashMs);
        t.classList.remove("flash", "on");
        await sleep(gapMs);
    }
    flashing = false;
    statusEl.textContent = coop.myTurn ? "Your turn — repeat the pattern!" : `${coop.partnerName}'s turn first…`;
}

async function onCoopTileClick(i, tile) {
    if (!coop.myTurn || flashing) return;
    if (!firstClickMs && startMs) firstClickMs = Date.now() - startMs;

    const isCorrect = (coopSeq[coopPlayerIdx] === i);
    const nextIdx    = isCorrect ? coopPlayerIdx + 1 : coopPlayerIdx;

    if (isCorrect) {
        tile.classList.add("on");
        setTimeout(() => tile.classList.remove("on"), 250);
    } else {
        mistakes++;
        tile.classList.add("tile-shake");
        setTimeout(() => tile.classList.remove("tile-shake"), 400);
    }

    coop.myTurn = false;

    if (isCorrect && nextIdx === coopSeq.length) {
        // Puzzle solved! Let the server know via the action endpoint too so revealed/turn stay correct.
        await coopAction("tile_click", { idx: i, correct: 1, player_index: nextIdx });
        await coopPuzzleSolved();
        return;
    }

    await coopAction("tile_click", { idx: i, correct: isCorrect ? 1 : 0, player_index: nextIdx });
}

async function coopAction(action, fields) {
    const fd = new FormData();
    fd.append("code",   coop.roomCode);
    fd.append("player", username);
    fd.append("action", action);
    Object.entries(fields || {}).forEach(([k, v]) => fd.append(k, v));
    try {
        const res  = await fetch("php/coop_action.php", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) {
            console.warn(`[coop] action "${action}" failed:`, data.error, fields);
        } else {
            console.log(`[coop] action "${action}" ok`, fields, "→ nextTurn:", data.nextTurn ?? "(unchanged)");
        }
        return data;
    } catch (e) {
        console.warn(`[coop] action "${action}" network error:`, e);
        return { error: "network" };
    }
}

async function coopActionSafe(action, fields) {
    let result = await coopAction(action, fields);
    if (result && result.error) {
        await sleep(300);
        result = await coopAction(action, fields);
        if (result && result.error) {
            console.error(`[coop] action "${action}" failed twice — board may be stuck. Forcing a poll to resync.`);
        }
    }
    return result;
}

let coopCards   = [];
let coopMatched = [];
let coopFlipped = [];
let coopLocked  = false;
let coopShapePreviewing = false;

function getCoopShapePreviewMs(diff) {
    if (diff <= 1) return 10000;
    if (diff <= 3) return 20000;
    if (diff <= 5) return 30000;
    return 45000;
}

function buildCoopShapeGrid(data) {
    const cardData = data.cards || [];
    const { cols: dCols, rows: dRows } = getShapeGrid(coop.coopDiff);
    const cols     = data.cols  || dCols;
    const rows     = data.rows  || dRows;
    coopMatched    = data.matched || [];
    coopFlipped    = [];
    coopLocked     = false;
    _coopCardDefs  = data.cards || [];
    _coopGridCols  = data.cols  || cols;
    _coopGridRows  = data.rows  || rows;

    puzzleEl.className = "shape-grid";
    puzzleEl.style.gridTemplateColumns = `repeat(${cols}, var(--shape-tile))`;

    const maxW     = Math.floor((window.innerWidth  * 0.88) / cols) - 10;
    const maxH     = Math.floor((window.innerHeight * 0.62) / rows) - 10;
    const tileSize = Math.max(44, Math.min(88, maxW, maxH));
    puzzleEl.style.setProperty("--shape-tile", tileSize + "px");

    const shapeByName = {};
    SHAPES.forEach(s => { shapeByName[s.name] = s; });

    coopCards = cardData.map((data, idx) => {
        const shape = shapeByName[data.shapeName] || SHAPES[0];
        const wrap  = document.createElement("div"); wrap.className = "shape-card";
        const inner = document.createElement("div"); inner.className = "shape-card-inner";
        const front = document.createElement("div"); front.className = "shape-card-front";
        front.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${shape.draw({ color: data.color })}</svg>`;
        const back = document.createElement("div"); back.className = "shape-card-back";
        back.innerHTML = `<span class="card-back-rune">✦</span>`;
        inner.appendChild(front); inner.appendChild(back);
        wrap.appendChild(inner); puzzleEl.appendChild(wrap);

        const card = { idx, pairIdx: data.pairIdx, el: wrap, matched: false, faceUp: false };

        if (coopMatched.includes(data.pairIdx)) {
            card.matched = true;
            card.faceUp  = true;
            wrap.classList.add("revealed", "shape-matched");
        }

        wrap.addEventListener("click", () => onCoopCardClick(card));
        return card;
    });

    const totalPairs = cardData.length / 2;

    const alreadyInProgress = (coopMatched && coopMatched.length > 0);
    if (alreadyInProgress) {
        statusEl.textContent = coop.myTurn
            ? `Your turn! Find all ${totalPairs} pairs.`
            : `${coop.partnerName}'s turn first…`;
        startMs = Date.now(); startTimer();
        return;
    }

    coopShapePreviewing = true;
    requestAnimationFrame(() => {
        coopCards.forEach(c => { if (!c.matched) { c.el.classList.add("previewing"); c.faceUp = true; } });
    });

    const previewMs  = getCoopShapePreviewMs(coop.coopDiff);
    const previewEnd = Date.now() + previewMs;

    clearInterval(window.__countdown);
    window.__countdown = setInterval(() => {
        const remaining = Math.ceil((previewEnd - Date.now()) / 1000);
        if (remaining > 0) statusEl.textContent = `Memorise the pairs together… (${remaining}s)`;
        else clearInterval(window.__countdown);
    }, 250);
    statusEl.textContent = `Memorise the pairs together… (${Math.ceil(previewMs/1000)}s)`;

    function endCoopShapePreview() {
        clearInterval(window.__countdown);
        const indices   = coopCards.map((_, i) => i).sort(() => Math.random() - 0.5);
        const staggerMs = Math.min(55, 700 / coopCards.length);
        indices.forEach((cardIdx, i) => {
            setTimeout(() => {
                const c = coopCards[cardIdx];
                if (c && !c.matched) { c.el.classList.remove("previewing"); c.faceUp = false; }
            }, i * staggerMs);
        });
        setTimeout(() => {
            coopShapePreviewing = false;
            statusEl.textContent = coop.myTurn
                ? `Your turn! Find all ${totalPairs} pairs.`
                : `${coop.partnerName}'s turn first…`;
            startMs = Date.now(); startTimer();
        }, coopCards.length * staggerMs + 400);
    }

    window.__coopShapePreviewTimeout = setTimeout(endCoopShapePreview, previewMs);
}

async function onCoopCardClick(card) {
    if (coopShapePreviewing) return;
    if (!coop.myTurn || coopLocked || card.matched || card.faceUp || coopFlipped.length >= 2) return;
    if (!firstClickMs && startMs) firstClickMs = Date.now() - startMs;

    card.el.classList.add("revealed");
    card.faceUp = true;
    coopFlipped.push(card.idx);

    if (coopFlipped.length === 1) {
        await coopAction("flip1", { idx: card.idx });
        return;
    }

    coopLocked = true;
    const [aIdx, bIdx] = coopFlipped;
    const a = coopCards[aIdx], b = coopCards[bIdx];

    if (a.pairIdx === b.pairIdx) {
        const result = await coopAction("flip2_match", { a_idx: aIdx, b_idx: bIdx, pair_idx: a.pairIdx });
        const matched = (result && result.state && result.state.matched) || [...coopMatched, a.pairIdx];

        await sleep(450);
        a.el.classList.add("shape-matched"); b.el.classList.add("shape-matched");
        a.matched = true; b.matched = true;
        coopMatched = matched;
        coopFlipped = []; coopLocked = false;

        if (coopMatched.length === coopCards.length / 2) {
            coop.myTurn = false;
            await coopActionSafe("pass_turn_after_match", {});
            await coopPuzzleSolved();
            return;
        }
        coop.myTurn = false;
        await coopActionSafe("pass_turn_after_match", {});

    } else {
        mistakes++;
        coop.myTurn = false;
        await coopAction("flip2_nomatch", { a_idx: aIdx, b_idx: bIdx });
        await sleep(1400);
        a.el.classList.remove("revealed"); b.el.classList.remove("revealed");
        a.faceUp = false; b.faceUp = false;
        coopFlipped = []; coopLocked = false;
        await coopActionSafe("clear_nomatch", {});
    }
}

function applyRemoteState(data) {
    if (coop.coopPuzzle === "memory") {
        coopPlayerIdx = data.playerIndex ?? coopPlayerIdx;
        const tiles = [...document.querySelectorAll(".tile")];
        console.log(`[coop] memory mirror render: lastTile=${data.lastTile} correct=${data.correct} playerIndex=${data.playerIndex} sig=${coopLastMirrorSig}`);

        if (data.lastTile !== undefined && data.lastTile !== null) {
            const sig = `${data.playerIndex}:${data.lastTile}:${data.correct}`;
            if (sig !== coopLastMirrorSig) {
                coopLastMirrorSig = sig;
                const t = tiles[data.lastTile];
                if (t) {
                    if (data.correct) {
                        t.classList.add("flash", "on");
                        setTimeout(() => t.classList.remove("flash", "on"), 650);
                    } else {
                        t.classList.add("tile-shake");
                        setTimeout(() => t.classList.remove("tile-shake"), 400);
                    }
                }
            }
        }
        coopRevealed = data.revealed || coopRevealed;

    } else if (coop.coopPuzzle === "shape") {
        if (coopShapePreviewing) { updateTurnIndicator(); return; }
        if (coopLocked || coopFlipped.length > 0) { updateTurnIndicator(); return; }

        const remoteMatched = data.matched || [];
        const remoteFlipped = data.flipped || [];
        console.log(`[coop] mirror render: matched=${JSON.stringify(remoteMatched)} flipped=${JSON.stringify(remoteFlipped)} phase=${data.phase}`);
        coopMatched = remoteMatched;

        coopCards.forEach(c => {
            const isMatched = remoteMatched.includes(c.pairIdx);
            const isFlipped = remoteFlipped.includes(c.idx);

            if (isMatched) {
                if (!c.matched) {
                    c.matched = true; c.faceUp = true;
                    c.el.classList.add("revealed", "shape-matched");
                }
            } else if (isFlipped) {
                if (!c.faceUp) {
                    c.faceUp = true;
                    c.el.classList.add("revealed");
                }
            } else {
                if (c.faceUp || c.el.classList.contains("revealed")) {
                    c.faceUp = false; c.matched = false;
                    c.el.classList.remove("revealed", "shape-matched");
                }
            }
        });

        if (data.phase === "nomatch") {
            remoteFlipped.forEach(idx => {
                const c = coopCards[idx];
                if (c) { c.el.classList.add("shape-wrong"); setTimeout(() => c.el.classList.remove("shape-wrong"), 600); }
            });
        }
    }
    updateTurnIndicator();
}

let _coopCardDefs = [];
let _coopGridCols = 4;
let _coopGridRows = 2;


async function coopPuzzleSolved() {
    clearInterval(window.__t);
    const timeSec = ((Date.now() - startMs) / 1000).toFixed(1);
    statusEl.textContent = "Puzzle solved! ✨";
    try { if (chime) { chime.currentTime = 0; await chime.play(); } } catch(e) {}

    await submitCoopRound(true, parseFloat(timeSec), mistakes);

    const fd = new FormData();
    fd.append("code",  coop.roomCode);
    fd.append("state", JSON.stringify({ roundOver: true, roundWon: true }));
    await fetch("php/update_state.php", { method:"POST", body:fd });

    showCoopSummary();
}

async function submitCoopRound(won, completionTime, roundMistakes) {
    if (!coop.pairKey) return;
    const clsCode = typeof PHP_CLASSROOM_CODE !== "undefined" ? PHP_CLASSROOM_CODE : "";
    const sorted  = [username, coop.partnerName].sort();
    const fd = new FormData();
    fd.append("pair_key",        coop.pairKey);
    fd.append("player_a",        sorted[0]);
    fd.append("player_b",        sorted[1]);
    fd.append("classroom_code",  clsCode || "");
    fd.append("scene_theme",     coop.sceneTheme);
    fd.append("won",             won ? 1 : 0);
    fd.append("completion_time", completionTime ?? 0);
    fd.append("mistakes",        roundMistakes ?? 0);
    try {
        const res  = await fetch("php/submit_coop_round.php", { method:"POST", body:fd });
        const data = await res.json();
        if (data.ok) coop.lastProgress = data;
    } catch(e) {}
}

function showCoopSummary() {
    document.getElementById("coop-summary-screen")?.remove();
    coop.puzzleRunning = false;

    if (!coop.pairKey) {
        const el = document.createElement("div");
        el.id = "coop-summary-screen";
        el.style.cssText = [
            "position:fixed","inset:0","background:rgba(6,0,15,.95)",
            "display:flex","flex-direction:column","align-items:center",
            "justify-content:center","z-index:500","gap:16px",
            "text-align:center","padding:28px"
        ].join(";");
        el.innerHTML = `
            <div style="font-size:2.8rem;">🎉</div>
            <h2 style="color:var(--magenta);margin:0;font-size:1.4rem;">Puzzle Solved Together!</h2>
            <p style="color:var(--muted);margin:0;font-size:.95rem;">Great teamwork with ${coop.partnerName}.</p>
            <button id="coop-next-btn" style="margin-top:10px;min-width:200px;">▶ Play Again</button>
            <button id="coop-retry-btn" class="ghost" style="min-width:200px;">↩ Retry Same Puzzle</button>
            <button id="coop-exit-btn" class="ghost" style="min-width:200px;">← Back to Menu</button>
        `;
        document.body.appendChild(el);
        document.getElementById("coop-next-btn").addEventListener("click", () => { el.remove(); advanceCoopRound(); });
        document.getElementById("coop-retry-btn").addEventListener("click", () => { el.remove(); retryCoopRound(); });
        document.getElementById("coop-exit-btn").addEventListener("click", () => { location.reload(); });
        return;
    }

    const p        = coop.lastProgress ?? {};
    const roundsWon = p.roundsWon    ?? 0;
    const badges    = p.badgesEarned ?? 0;
    const decs      = p.decorations  ?? [];
    const theme     = p.sceneTheme   ?? coop.sceneTheme;
    const newBadge  = p.newBadge     ?? false;
    const catalog   = COOP_DECORATIONS[theme] || COOP_DECORATIONS["space"];
    const toNext    = 5 - (roundsWon % 5);

    const slots = Array.from({ length: 10 }, (_, i) => {
        const unlocked = decs.includes(i);
        return `<div style="width:56px;height:56px;border-radius:12px;font-size:1.75rem;
            display:flex;align-items:center;justify-content:center;
            background:${unlocked ? "rgba(255,95,203,.18)" : "rgba(255,255,255,.04)"};
            border:1.5px solid ${unlocked ? "rgba(255,95,203,.55)" : "rgba(255,255,255,.07)"};
            ${unlocked ? "box-shadow:0 0 16px rgba(255,95,203,.28);" : ""}
        ">${unlocked ? catalog[i] : "✦"}</div>`;
    }).join("");

    const badgeRow = badges > 0
        ? Array.from({ length: badges }, () => `<span style="font-size:1.5rem;">🏅</span>`).join("")
        : `<span style="color:var(--muted);font-size:.82rem;">${toNext} round${toNext!==1?"s":""} until first badge</span>`;

    const el = document.createElement("div");
    el.id = "coop-summary-screen";
    el.style.cssText = [
        "position:fixed","inset:0","background:rgba(6,0,15,.95)",
        "display:flex","flex-direction:column","align-items:center",
        "justify-content:center","z-index:500","gap:14px",
        "text-align:center","padding:28px","overflow-y:auto"
    ].join(";");

    el.innerHTML = `
        <div style="font-size:2.6rem;">${coopThemeEmoji(theme)}</div>
        <h2 style="color:var(--magenta);margin:0;font-size:1.3rem;">Puzzle Complete! 🎉</h2>
        <p style="color:var(--muted);margin:0;font-size:.95rem;">
            You solved it together ✨ · <strong style="color:var(--text);">${roundsWon}</strong> total rounds won
        </p>
        ${newBadge ? `<div style="padding:10px 20px;background:rgba(255,210,0,.12);border:1.5px solid rgba(255,210,0,.45);border-radius:12px;font-size:1rem;color:#ffd700;">🏅 New badge earned!</div>` : ""}
        <div>
            <p style="color:var(--muted);font-size:.76rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 7px;">Badges</p>
            <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;min-height:28px;">${badgeRow}</div>
        </div>
        <div>
            <p style="color:var(--muted);font-size:.76rem;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 9px;">
                ${coopThemeEmoji(theme)} ${theme.charAt(0).toUpperCase()+theme.slice(1)} Tapestry · ${decs.length}/10
            </p>
            <div style="display:grid;grid-template-columns:repeat(5,56px);gap:9px;justify-content:center;">${slots}</div>
        </div>
        <button id="coop-next-btn" style="margin-top:10px;min-width:200px;">▶ Play Again</button>
        <button id="coop-retry-btn" class="ghost" style="min-width:200px;">↩ Retry Same Puzzle</button>
    `;
    document.body.appendChild(el);

    document.getElementById("coop-next-btn").addEventListener("click", () => {
        el.remove();
        advanceCoopRound();
    });
    document.getElementById("coop-retry-btn").addEventListener("click", () => {
        el.remove();
        retryCoopRound();
    });
}

async function advanceCoopRound() {
    coop.puzzleRunning    = false;
    coop._readyThisRound  = false;
    coop._startedThisRound = false;

    clearInterval(window.__t);
    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    puzzleEl.innerHTML = ""; puzzleEl.className = "";
    overlay.classList.add("hidden");
    document.getElementById("coop-turn-banner")?.remove();

    if (coop.iAmPlayerA && !coop._turnAdvanced) {
        coop._turnAdvanced = true;
        const fd = new FormData();
        fd.append("code",         coop.roomCode);
        fd.append("game_started", 0);
        fd.append("round_number", (coop.roundNumber || 0) + 1);
        fd.append("current_turn", username); // A goes first again
        fd.append("state",        JSON.stringify({ roundOver: false }));
        await fetch("php/update_state.php", { method:"POST", body:fd });
        // Reset ready flags
        const fd2 = new FormData(); fd2.append("code", coop.roomCode);
        await fetch("php/reset_ready.php", { method:"POST", body:fd2 });
        setTimeout(() => { coop._turnAdvanced = false; }, 4000);
    }

    startCoopPoll();
}

async function retryCoopRound() {
    coop.puzzleRunning     = false;
    coop._readyThisRound   = false;
    coop._startedThisRound = false;

    clearInterval(window.__t);
    gameSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    puzzleEl.innerHTML = ""; puzzleEl.className = "";
    overlay.classList.add("hidden");
    document.getElementById("coop-turn-banner")?.remove();

    if (coop.iAmPlayerA && !coop._turnAdvanced) {
        coop._turnAdvanced = true;
        const fd = new FormData();
        fd.append("code",         coop.roomCode);
        fd.append("game_started", 0);
        fd.append("round_number", coop.roundNumber);
        fd.append("current_turn", username);
        fd.append("state",        JSON.stringify({ roundOver: false }));
        await fetch("php/update_state.php", { method:"POST", body:fd });
        const fd2 = new FormData(); fd2.append("code", coop.roomCode);
        await fetch("php/reset_ready.php", { method:"POST", body:fd2 });
        setTimeout(() => { coop._turnAdvanced = false; }, 4000);
    }

    startCoopPoll();
}

window.addEventListener("load", () => {
    const partner = typeof PHP_COOP_PARTNER !== "undefined" ? PHP_COOP_PARTNER : null;
    if (!partner) return;
    coop.active = true;
    setTimeout(initCoopMode, 200);
});