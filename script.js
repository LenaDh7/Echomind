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

// ─── Init ──────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
    loadState();
    if (playerNameEl) playerNameEl.textContent = username;
    if (window.WitchlightParticles) WitchlightParticles.mount("particles");

    if (startLevelInput) {
        startLevelInput.value = difficulty;
        updateSliderUI(difficulty);
    }
    // Delay marker build so layout is fully painted
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

    // Stats modal close
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
    });
});

// ─── Slider ────────────────────────────────────────────────────────────────
function updateSliderUI(val) {
    const n = parseInt(val);
    if (levelDisplay) levelDisplay.textContent = n;
    if (levelHint) {
        if (n < 3)      levelHint.textContent = "3×3 grid · Beginner";
        else if (n < 7) levelHint.textContent = "4×4 grid · Intermediate";
        else            levelHint.textContent = "5×5 grid · Advanced";
    }
}

function buildSliderMarkers() {
    const slider  = document.getElementById("start-level");
    const markers = document.getElementById("slider-markers");
    if (!slider || !markers) return;
    markers.innerHTML = "";
    const thumbW  = 20;
    const total   = 10;
    const trackW  = slider.offsetWidth;
    if (trackW === 0) { setTimeout(buildSliderMarkers, 100); return; }
    const usable  = trackW - thumbW; // actual travel distance of thumb centre
    for (let i = 0; i <= total; i++) {
        const s = document.createElement("span");
        s.textContent = i;
        const px = (i / total) * usable + (thumbW / 2);
        s.style.left = px + "px";
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
        startNewPuzzle();
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

// ─── Logout ────────────────────────────────────────────────────────────────
if (logoutBtn) logoutBtn.addEventListener("click", () => { window.location.href = "logout.php"; });

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

// ─── Game logic ────────────────────────────────────────────────────────────
if (giveupBtn) giveupBtn.addEventListener("click", () => {
    const timeSec = startMs ? (Date.now() - startMs) / 1000 : 0;
    const entry = { username, difficulty, completion_time: timeSec, mistakes, outcome: "giveup" };
    pushLeaderboard(entry);
    sendScoreToServer(entry);
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

    const entry = { username, difficulty, completion_time: parseFloat(timeSec), mistakes, outcome: "win" };
    pushLeaderboard(entry);
    sendScoreToServer(entry);

    resDiff.textContent     = difficulty;
    resTime.textContent     = timeSec;
    resMistakes.textContent = mistakes;
    overlay.classList.remove("hidden");
}

if (continueBtn) continueBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    difficulty = heuristicNext(difficulty, parseFloat(resTime.textContent), parseInt(resMistakes.textContent));
    saveState(); startNewPuzzle();
});

if (retryBtn) retryBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    sendScoreToServer({ username, difficulty, completion_time: 0, mistakes, outcome: "retry" });
    playerIndex = 0; startMs = 0;
    timerEl.textContent = "Time: 0.0s";
    flashSequence();
});

// ─── Timer / utils ─────────────────────────────────────────────────────────
function startTimer() {
    clearInterval(window.__t);
    window.__t = setInterval(() => {
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

// ─── Leaderboard ───────────────────────────────────────────────────────────
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
    const global = [...server, ...local].sort((a,b) => b.difficulty - a.difficulty).slice(0,10);
    renderGlobal(global);
    renderUser(local.filter(r => r.username === username).slice(-10).reverse());
}
function renderGlobal(rows) {
    const tb = document.getElementById("global-body"); if (!tb) return; tb.innerHTML = "";
    (rows||[]).forEach(r => { const tr = document.createElement("tr"); tr.innerHTML = `<td>${r.username}</td><td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`; tb.appendChild(tr); });
}
function renderUser(rows) {
    const tb = document.getElementById("user-body"); if (!tb) return; tb.innerHTML = "";
    (rows||[]).forEach(r => { const tr = document.createElement("tr"); tr.innerHTML = `<td>${r.difficulty}</td><td>${fmt(r.completion_time)}</td><td>${r.mistakes}</td><td>${r.outcome}</td>`; tb.appendChild(tr); });
}

// ─── Score submit ──────────────────────────────────────────────────────────
async function sendScoreToServer(entry) {
    try {
        const body = new URLSearchParams({
            username: entry.username, puzzle_type: selectedPuzzle || "memory",
            difficulty: entry.difficulty, time: entry.completion_time,
            mistakes: entry.mistakes, outcome: entry.outcome,
            classroom_code: classroomCode || ""
        });
        await fetch("php/submit_score.php", { method:"POST", body });
    } catch(e) {}
}

// ─── Stats chart ───────────────────────────────────────────────────────────
let chartsLoaded = false;
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

async function loadCharts() {
    try {
        const res  = await fetch(`php/stats.php?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!data || !data.length) {
            document.getElementById("stats-empty").style.display = "block";
            return;
        }
        chartsLoaded = true;
        const labels = data.map(r => (r.created_at||"").slice(5,16));

        // 1. Completion Time
        new Chart(document.getElementById("chart-time").getContext("2d"), {
            type:"line",
            data:{ labels, datasets:[{
                data: data.map(r => parseFloat(r.completion_time).toFixed(1)),
                borderColor:"rgba(255,95,203,.9)", backgroundColor:"rgba(255,95,203,.12)",
                fill:true, tension:0.35, pointRadius:3, borderWidth:2
            }]},
            options:{ ...chartDefaults }
        });

        // 2. Difficulty
        new Chart(document.getElementById("chart-diff").getContext("2d"), {
            type:"line",
            data:{ labels, datasets:[{
                data: data.map(r => r.difficulty),
                borderColor:"rgba(201,44,255,.9)", backgroundColor:"rgba(201,44,255,.12)",
                fill:true, tension:0.35, pointRadius:3, borderWidth:2
            }]},
            options:{ ...chartDefaults, scales:{
                x:{ ticks:{color:"#cdb7e6",maxTicksLimit:6,font:{size:10}}, grid:{color:"#2a1440"} },
                y:{ min:0, max:10, ticks:{color:"#c92cff",stepSize:1,font:{size:10}}, grid:{color:"#2a1440"} }
            }}
        });

        // 3. Mistakes
        new Chart(document.getElementById("chart-mistakes").getContext("2d"), {
            type:"bar",
            data:{ labels, datasets:[{
                data: data.map(r => r.mistakes),
                backgroundColor:"rgba(255,73,113,.6)", borderColor:"rgba(255,73,113,.9)",
                borderWidth:1, borderRadius:4
            }]},
            options:{ ...chartDefaults }
        });

        // 4. Outcomes (doughnut)
        const outcomes = data.reduce((acc, r) => {
            acc[r.outcome] = (acc[r.outcome] || 0) + 1; return acc;
        }, {});
        new Chart(document.getElementById("chart-outcomes").getContext("2d"), {
            type:"doughnut",
            data:{
                labels: Object.keys(outcomes),
                datasets:[{
                    data: Object.values(outcomes),
                    backgroundColor:["rgba(255,95,203,.7)","rgba(201,44,255,.7)","rgba(255,73,113,.7)","rgba(100,200,255,.7)"],
                    borderColor:"rgba(19,7,28,.8)", borderWidth:2
                }]
            },
            options:{
                responsive:true,
                plugins:{ legend:{ position:"bottom", labels:{ color:"#cdb7e6", font:{size:11}, padding:10 } } }
            }
        });

    } catch(e) { console.log("Charts load failed:", e); }
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
    overlay.classList.add("hidden"); puzzleEl.innerHTML=""; mistakes=0; playerIndex=0;
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
                    <tbody>${scores.map(sc=>`<tr><td>${sc.puzzle_type}</td><td>${sc.difficulty}</td><td>${parseFloat(sc.completion_time).toFixed(1)}s</td><td>${sc.mistakes}</td><td>${sc.outcome}</td></tr>`).join("")}</tbody>
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