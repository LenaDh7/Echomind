const loginSection = document.getElementById("login");
const prestartSection = document.getElementById("prestart");
const gameSection = document.getElementById("game");
const statsSection = document.getElementById("stats");

const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("login-btn");
const playerNameEl = document.getElementById("playername");

const puzzleEl = document.getElementById("puzzle");
const diffEl = document.getElementById("difficulty");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const newBtn = document.getElementById("new-btn");
const logoutBtn = document.getElementById("logout-btn");
const overlay = document.getElementById("overlay");
const resDiff = document.getElementById("res-diff");
const resTime = document.getElementById("res-time");
const resMistakes = document.getElementById("res-mistakes");
const continueBtn = document.getElementById("continue-btn");
const retryBtn = document.getElementById("retry-btn");
const showStatsBtn = document.getElementById("show-stats");

const chime = document.getElementById("chime");
const ambient = document.getElementById("ambient");
if (chime) chime.volume = 0.7;
if (ambient) ambient.volume = 0.0;

const aboutBtnLogin = document.getElementById("about-btn");
const muteBtnLogin = document.getElementById("mute-btn");
const aboutBtnPre = document.getElementById("about-btn-pre");
const muteBtnPre = document.getElementById("mute-btn-pre");
const aboutBtnGame = document.getElementById("about-btn-game");
const muteBtnGame = document.getElementById("mute-btn-game");
const aboutOverlay = document.getElementById("about");
const aboutClose = document.getElementById("close-about");
const resetBtn = document.getElementById("reset-btn");

// Multiplayer Elements
const hostBtn = document.getElementById("host-btn");
const joinBtn = document.getElementById("join-btn");
const mpOverlay = document.getElementById("mp-overlay");
const mpContent = document.getElementById("mp-content");
const mpActions = document.getElementById("mp-actions");
const mpTitle = document.getElementById("mp-title");

let P_login = null, P_pre = null, P_game = null;

// Game state
let username = "";
let difficulty = 0;
let startMs = 0;
let mistakes = 0;
let sequence = [];
let playerIndex = 0;
let flashing = false;
let muted = false;

// Multiplayer State
let roomCode = null;
let isHost = false;
let syncTimer = null;
let playerReady = false;
let gameStarted = false;

// Local storage keys
const SKEY = "echomind_local_progress_v1";
const LBOARD = "echomind_local_leaderboard_v1";

// Local Data Functions
function loadState() {
    try {
        const s = JSON.parse(localStorage.getItem(SKEY) || "{}");
        if (s.username) username = s.username;
        if (Number.isFinite(s.difficulty)) difficulty = s.difficulty;
    } catch {}
}

function saveState() {
    localStorage.setItem(SKEY, JSON.stringify({ username, difficulty }));
}

function pushLeaderboard(entry) {
    const all = JSON.parse(localStorage.getItem(LBOARD) || "[]");
    all.push(entry);
    all.sort((a, b) => (b.difficulty - a.difficulty) || (a.completion_time - b.completion_time));
    while (all.length > 100) all.pop();
    localStorage.setItem(LBOARD, JSON.stringify(all));
    refreshBoards();
}

// Initialization
window.addEventListener("load", () => {
    if(window.WitchlightParticles) P_login = WitchlightParticles.mount("particles-login");
    loadState();
});

// About / Sound / Reset
if(aboutBtnLogin) aboutBtnLogin.addEventListener("click", () => aboutOverlay.classList.remove("hidden"));
if(aboutBtnPre) aboutBtnPre.addEventListener("click", () => aboutOverlay.classList.remove("hidden"));
if(aboutBtnGame) aboutBtnGame.addEventListener("click", () => aboutOverlay.classList.remove("hidden"));
if(aboutClose) aboutClose.addEventListener("click", () => aboutOverlay.classList.add("hidden"));

function setMuted(m) {
    muted = m;
    const label = muted ? "🔈" : "🔊";
    [muteBtnLogin, muteBtnPre, muteBtnGame].forEach(b => { if (b) b.textContent = label; });
    if (muted) { if(ambient) { ambient.volume = 0; ambient.pause(); } }
    else { if(ambient) ambient.play(); }
}
[muteBtnLogin, muteBtnPre, muteBtnGame].forEach(b => {
    if(b) b.addEventListener("click", () => setMuted(!muted));
});

if(resetBtn) resetBtn.addEventListener("click", () => {
    localStorage.removeItem(LBOARD);
    difficulty = 0;
    saveState();
    alert("Progress and local leaderboard cleared.");
});

// Login / Navigation
if(loginBtn) loginBtn.addEventListener("click", async () => {
    const u = (usernameInput.value || "").trim() || "Witchlight";
    username = u; saveState();
    loginSection.classList.add("hidden");
    prestartSection.classList.remove("hidden");
    playerNameEl.textContent = username;
    if (!P_pre && window.WitchlightParticles) P_pre = WitchlightParticles.mount("particles");

    try {
        if(ambient) {
            await ambient.play();
            const start = performance.now(), dur = 3000;
            (function ramp(t) {
            const p = Math.min(1, (t - start) / dur);
            ambient.volume = muted ? 0 : (p * 0.35);
            if (p < 1) requestAnimationFrame(ramp);
            })(start);
        }
    } catch (e) {}
    });

document.getElementById("start-btn").addEventListener("click", () => {
    prestartSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    if (!P_game && window.WitchlightParticles) P_game = WitchlightParticles.mount("particles-game");
    startNewPuzzle();
});

if(logoutBtn) logoutBtn.addEventListener("click", () => {
    username = "";
    difficulty = 0;
    saveState();
    window.location.reload();
});

// Game Logic (Single Player)
if(newBtn) newBtn.addEventListener("click", () => {
    const timeSec = startMs ? ((Date.now() - startMs) / 1000) : 0;
    pushLeaderboard({ username, difficulty, completion_time: timeSec, mistakes, outcome: "incomplete" });
    difficulty = heuristicNext(difficulty, timeSec, mistakes);
    saveState();
    startNewPuzzle();
});

    function startNewPuzzle() {
    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    mistakes = 0; sequence = []; playerIndex = 0;

    let size = 3;
    if (difficulty >= 3 && difficulty < 7) size = 4;
    else if (difficulty >= 7) size = 5;

    puzzleEl.style.gridTemplateColumns = `repeat(${size}, var(--tile))`;
    const total = size * size;

    for (let i = 0; i < total; i++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.index = i;
        t.addEventListener("click", () => onTileClick(i, t));
        puzzleEl.appendChild(t);
    }

    const base = 3 + Math.min(difficulty, 3);
    const extra = (difficulty >= 7 ? 3 : (difficulty >= 3 ? 1 : 0));
    const seqLen = base + extra;

    for (let i = 0; i < seqLen; i++)
        sequence.push(Math.floor(Math.random() * total));

    diffEl.textContent = difficulty;
    flashSequence();
    }

    async function flashSequence() {
    flashing = true;
    statusEl.textContent = "Watch the pattern...";
    const tiles = [...document.querySelectorAll(".tile")];
    const flashMs = Math.max(350, 650 - difficulty * 20),
            gapMs = Math.max(200, 300 - difficulty * 10);

    for (const idx of sequence) {
        const t = tiles[idx];
        t.classList.add("flash", "on");
        await sleep(flashMs);
        t.classList.remove("flash", "on");
        await sleep(gapMs);
    }

    statusEl.textContent = "Your turn — repeat the pattern.";
    flashing = false;
    playerIndex = 0;
    startMs = Date.now();
    startTimer();
    }

function onTileClick(i, tile) {
    if (flashing) return;
    const ok = sequence[playerIndex] === i;
    if (ok) {
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

    try { if(chime) { chime.currentTime = 0; await chime.play(); } } catch (e) {}

    const entry = {
        username,
        difficulty,
        completion_time: parseFloat(timeSec),
        mistakes,
        outcome: "win"
    };

    pushLeaderboard(entry);
    sendScoreToServer(entry); 

    resDiff.textContent = difficulty;
    resTime.textContent = timeSec;
    resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

if(continueBtn) continueBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    const time = parseFloat(resTime.textContent), m = parseInt(resMistakes.textContent);
    difficulty = heuristicNext(difficulty, time, m);
    saveState();
    startNewPuzzle();
});

if(retryBtn) retryBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    playerIndex = 0;
    startMs = 0;
    timerEl.textContent = "Time: 0.0s";
    flashSequence();
});

// Timer / Utility
function startTimer() {
    clearInterval(window.__t);
    window.__t = setInterval(() => {
        const s = ((Date.now() - startMs) / 1000).toFixed(1);
        timerEl.textContent = `Time: ${s}s`;
    }, 250);
}

function heuristicNext(d, t, m) {
    let dlt = 0;
    if (t <= 20 && m === 0) dlt = 1;
    else if (t >= 60 || m >= 4) dlt = -1;
    return Math.max(0, Math.min(10, d + dlt));
}

function fmt(v) { return (v?.toFixed ? v.toFixed(2) : v); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Leaderboard Rendering
async function fetchLeaderboardFromServer() {
    try {
        const res = await fetch("php/fetch_leaderboard.php");
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

async function refreshBoards() {
    const local = JSON.parse(localStorage.getItem(LBOARD) || "[]");
    let server = [];
    try { server = await fetchLeaderboardFromServer(); } catch {}
    const combined = [...server, ...local];
    const global = combined.sort((a, b) => b.difficulty - a.difficulty).slice(0, 10);
    renderGlobal(global);
    renderUser(local.filter(r => r.username === username).slice(-10).reverse());
}

function renderGlobal(rows) {
    const tb = document.getElementById("global-body");
    if(!tb) return;
    tb.innerHTML = "";
    (rows || []).forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.username}</td><td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`;
        tb.appendChild(tr);
    });
}

function renderUser(rows) {
    const tb = document.getElementById("user-body");
    if(!tb) return;
    tb.innerHTML = "";
    (rows || []).forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`;
        tb.appendChild(tr);
    });
}

// PHP Sync (Submit Scores)
async function sendScoreToServer(entry) {
    try {
        const body = new URLSearchParams({
        username: entry.username,
        puzzle_type: "memory",
        difficulty: entry.difficulty,
        time: entry.completion_time,
        mistakes: entry.mistakes,
        outcome: entry.outcome
        });
        await fetch("php/submit_score.php", { method: "POST", body });
    } catch (e) {
        console.warn("Server not reachable (using local only)", e);
    }
}

// Multiplayer Logic
function showMPOverlay(title, contentHTML, actionsHTML) {
    mpTitle.textContent = title;
    mpContent.innerHTML = contentHTML;
    mpActions.innerHTML = actionsHTML;
    mpOverlay.classList.remove("hidden");
}
function hideMPOverlay() { mpOverlay.classList.add("hidden"); }

// Host Logic
async function hostGame() {
    const fd = new FormData();
    fd.append("username", username);
    fd.append("puzzle", "memory"); 

    try {
        const res = await fetch("php/create_room.php", { method: "POST", body: fd });
        if(res.status === 404) { alert("Error: php/create_room.php not found. Check file structure."); return; }
        
        const data = await res.json();
        if (data.error) { alert("Server Error: " + data.error); return; }
        
        roomCode = data.code;
        isHost = true;
        
        showLobbyUI();
        startPolling();
        
    } catch(e) { console.error(e); alert("Connection failed. Is XAMPP/WAMP running?"); }
}

// Join UI Logic
function openJoinModal() {
    const content = `
        <div style="margin:10px 0;">
            <p style="color:var(--muted); margin-bottom:8px;">Enter the 6-character room code:</p>
            <input type="text" id="join-input-code" maxlength="6" 
                style="font-size:1.8rem; text-align:center; letter-spacing:6px; text-transform:uppercase; width:100%; max-width:260px; padding:8px; border-radius:8px; border:2px solid var(--magenta-d); background:#0f0718; color:var(--magenta);"
            />
            <p id="join-error" style="color:var(--error); height:20px; font-size:0.9rem; margin-top:5px;"></p>
        </div>
    `;
    const actions = `
        <button id="modal-join-confirm">Join Room</button>
        <button id="modal-join-cancel" class="ghost">Cancel</button>
    `;
    
    showMPOverlay("Join Multiplayer", content, actions);
    
    // Focus the input
    setTimeout(() => document.getElementById("join-input-code").focus(), 100);

    // Bind actions
    document.getElementById("modal-join-confirm").addEventListener("click", () => {
        const val = document.getElementById("join-input-code").value.trim().toUpperCase();
        if(val.length < 6) {
            document.getElementById("join-error").textContent = "Code must be 6 characters";
            return;
        }
        submitJoin(val);
    });
    
    document.getElementById("modal-join-cancel").addEventListener("click", hideMPOverlay);
}

async function submitJoin(codeIn) {
    const fd = new FormData();
    fd.append("code", codeIn);
    fd.append("username", username);
    
    try {
        const res = await fetch("php/join_room.php", { method: "POST", body: fd });
        if(res.status === 404) { alert("Error: php/join_room.php not found."); return; }

        const data = await res.json();
        if (data.error) { 
            document.getElementById("join-error").textContent = data.error; 
            return; 
        }
        
        roomCode = codeIn;
        isHost = false;
        
        showLobbyUI();
        startPolling();
        
    } catch(e) { console.error(e); alert("Connection failed."); }
}

// Lobby UI
function showLobbyUI() {
    const title = isHost ? "Hosting Game" : "Joined Game";
    
    const content = `
        <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:12px; margin-bottom:20px; border:1px solid rgba(255,95,203,0.15);">
            <p style="color:var(--muted); margin:0 0 5px 0; font-size:0.85rem; text-transform:uppercase; letter-spacing:2px;">Room Code</p>
            <div style="position:relative; display:inline-block;">
                <h1 style="color:var(--magenta); font-size:3rem; letter-spacing:8px; margin:0; font-family:monospace; text-shadow:0 0 20px rgba(255,95,203,0.5); cursor:pointer;"
                    title="Click to Copy" onclick="navigator.clipboard.writeText('${roomCode}'); alert('Code copied!');">
                    ${roomCode}
                </h1>
            </div>
            <p style="font-size:0.8rem; color:var(--muted); opacity:0.6; margin-top:5px;">(Click code to copy)</p>
        </div>
        <div id="lobby-status" style="margin-bottom:12px; font-weight:600; color:var(--text);">Waiting for players...</div>
        <div id="player-list" style="font-size:1rem; background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; min-height:60px; display:flex; flex-direction:column; justify-content:center; gap:5px;"></div>
    `;

    const actions = `<button id="mp-ready-btn" class="small">I'm Ready</button>`;
    
    showMPOverlay(title, content, actions);
    
    const rBtn = document.getElementById("mp-ready-btn");
    if(rBtn) rBtn.addEventListener("click", sendReady);
}

async function sendReady() {
    const fd = new FormData();
    fd.append("code", roomCode);
    fd.append("username", username);
    await fetch("php/check_ready.php", { method: "POST", body: fd });
    
    const btn = document.getElementById("mp-ready-btn");
    if(btn) { btn.textContent = "Waiting..."; btn.disabled = true; }
    playerReady = true;
}

function startPolling() {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(syncState, 2000); 
}

async function syncState() {
    if (!roomCode) return;
    try {
        const res = await fetch(`php/sync_state.php?code=${roomCode}`);
        const data = await res.json();
        
        if (data.error) {
            clearInterval(syncTimer);
            alert("Room closed or error.");
            hideMPOverlay();
            return;
        }

        const statusDiv = document.getElementById("lobby-status");
        const listDiv = document.getElementById("player-list");
        
        if(statusDiv && listDiv) {
            let p1 = data.host ? `${data.host} ${data.readyHost ? "✅" : "..."}` : "Host (waiting)";
            let p2 = data.guest ? `${data.guest} ${data.readyGuest ? "✅" : "..."}` : "Guest (waiting)";
            listDiv.innerHTML = `<p>${p1}</p><p>${p2}</p>`;
            
            if (data.gameStarted) {
                statusDiv.textContent = "Game Starting!";
            } else if (data.bothReady) {
                statusDiv.textContent = "Both Ready! Launching...";
            } else {
                statusDiv.textContent = "Waiting for ready signals...";
            }
        }

        // Host launches game
        if (isHost && data.bothReady && !data.gameStarted && !gameStarted) {
            gameStarted = true;
            const seq = generateRandomSequence(difficulty || 0);
            
            const fd = new FormData();
            fd.append("code", roomCode);
            fd.append("state", JSON.stringify({ sequence: seq, difficulty: difficulty }));
            await fetch("php/update_state.php", { method: "POST", body: fd });
            
            const fd2 = new FormData();
            fd2.append("code", roomCode);
            await fetch("php/start_game.php", { method: "POST", body: fd2 });
        }

        // Both enter game
        if (data.gameStarted && data.sequence) {
            clearInterval(syncTimer);
            hideMPOverlay();
            launchMPGame(data.sequence, data.difficulty);
        }
    } catch (e) { console.error("Sync error", e); }
}

function generateRandomSequence(diff) {
    const size = (diff >= 7) ? 5 : ((diff >= 3) ? 4 : 3);
    const total = size * size;
    const base = 3 + Math.min(diff, 3);
    const extra = (diff >= 7 ? 3 : (diff >= 3 ? 1 : 0));
    const seqLen = base + extra;
    const arr = [];
    for(let i=0; i<seqLen; i++) arr.push(Math.floor(Math.random() * total));
    return arr;
}

function launchMPGame(serverSequence, serverDiff) {
    prestartSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    if (!P_game && window.WitchlightParticles) P_game = WitchlightParticles.mount("particles-game");
    
    difficulty = serverDiff || 0;
    sequence = serverSequence;
    
    overlay.classList.add("hidden");
    puzzleEl.innerHTML = "";
    mistakes = 0; playerIndex = 0;
    
    let size = 3;
    if (difficulty >= 3 && difficulty < 7) size = 4;
    else if (difficulty >= 7) size = 5;

    puzzleEl.style.gridTemplateColumns = `repeat(${size}, var(--tile))`;
    const total = size * size;

    for (let i = 0; i < total; i++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.index = i;
        t.addEventListener("click", () => onTileClick(i, t));
        puzzleEl.appendChild(t);
    }
    
    diffEl.textContent = difficulty;
    
    setTimeout(() => { flashSequence(); }, 1000); 
}

// Statistics Chart
document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById('progressChart');
    
    if (hostBtn) hostBtn.addEventListener("click", hostGame);
    if (joinBtn) joinBtn.addEventListener("click", openJoinModal);

    if (!chartCanvas || typeof Chart === 'undefined') return;

    fetch(`php/stats.php?username=${username}`)
        .then(response => response.json())
        .then(data => {
        const labels = data.map(row => row.created_at);
        const times = data.map(row => row.completion_time);

        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
            labels: labels,
            datasets: [{
                label: 'Completion Time (seconds)',
                data: times,
                borderColor: 'rgba(204, 51, 255, 0.8)',
                backgroundColor: 'rgba(204, 51, 255, 0.1)',
                fill: true,
                tension: 0.3
            }]
            },
            options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Player Progress', color: '#fff' },
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { color: '#333' } },
                y: { ticks: { color: '#ccc' }, grid: { color: '#333' } }
            }
            }
        });
        })
        .catch(err => console.log("Chart load skipped"));
    });

if(showStatsBtn) {
    showStatsBtn.addEventListener("click", () => {
        statsSection.classList.toggle("hidden");
    });
}