<?php
session_start();
require_once "php/db_connect.php";

// Redirect if not logged in
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

$username       = $_SESSION['username'];
$role           = $_SESSION['role'] ?? 'player';
$classroom_code = $_SESSION['classroom_code'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EchoMind — Witchlight Memory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <link rel="icon" href="icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="style.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="wrap">

    <!-- ═══════════════════════════════════════════
        PUZZLE SELECT SCREEN (replaces prestart)
    ════════════════════════════════════════════ -->
    <section id="prestart">
      <canvas id="particles" class="particles"></canvas>
      <div class="centerbox" style="z-index:1; width:100%; max-width:720px;">

        <h2 style="margin-bottom:2px;">Welcome, <span id="playername"></span></h2>
        <p class="hint" style="margin-bottom:20px;">Choose your puzzle and starting level.</p>

        <!-- Puzzle Cards -->
        <div class="puzzle-cards" id="puzzle-cards">

          <div class="puzzle-card selected" data-puzzle="memory">
            <div class="card-icon">🌙</div>
            <div class="card-title">Witchlight Memory</div>
            <div class="card-desc">Watch the pattern of lights and repeat the sequence. Calming and precise.</div>
          </div>

          <div class="puzzle-card locked" data-puzzle="echo">
            <div class="card-icon">🔮</div>
            <div class="card-title">Echo Rhythm</div>
            <div class="card-desc">Coming soon — a rhythm-based memory challenge.</div>
            <div class="card-lock">🔒 Coming Soon</div>
          </div>

          <div class="puzzle-card locked" data-puzzle="veil">
            <div class="card-icon">✨</div>
            <div class="card-title">Veil Pattern</div>
            <div class="card-desc">Coming soon — visual pattern matching under pressure.</div>
            <div class="card-lock">🔒 Coming Soon</div>
          </div>

        </div>

        <!-- Difficulty Slider -->
        <div class="level-selector">
          <div class="level-label">
            <span>Starting Level</span>
            <span class="level-value" id="level-display">0</span>
          </div>
          <div class="slider-track">
            <input type="range" id="start-level" min="0" max="10" value="0" step="1" />
            <div class="slider-markers">
              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
              <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
            </div>
          </div>
          <div class="level-hint" id="level-hint">3×3 grid · Beginner</div>
        </div>

        <button id="start-btn" style="margin-top:16px; padding:14px 40px; font-size:1.1rem;">Begin Puzzle</button>

        <!-- Multiplayer -->
        <div class="multiplayer" style="margin-top:12px;">
          <button id="host-btn" class="ghost small">Host Multiplayer</button>
          <button id="join-btn" class="ghost small">Join Room</button>
        </div>

        <?php if ($role === 'teacher'): ?>
        <div style="margin-top:16px;">
          <button id="open-dashboard-btn" class="ghost small">🏫 Classroom Dashboard</button>
        </div>
        <?php endif; ?>

        <div style="margin-top:12px;">
          <button id="reset-btn" class="ghost small">Reset Progress</button>
        </div>
      </div>

      <button id="mute-btn-pre" class="icon-btn">🔊</button>
      <button id="about-btn-pre" class="icon-btn">?</button>

      <div id="about" class="about hidden">
        <div class="about-content">
          <h3>EchoMind: Witchlight Memory</h3>
          <p><em>Created by <strong>Eleni D.</strong></em></p>
          <p>In the quiet hum of the Witchlight, memory becomes ritual. Each sequence of light is a test of focus, patience, and stillness — a meditative challenge designed to sharpen attention while calming the mind.</p>
          <p><strong>EchoMind</strong> is a soft puzzle of rhythm and recall — part memory trainer, part spell of concentration.</p>
          <button id="close-about" class="ghost">Close</button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
        GAME SCREEN
    ════════════════════════════════════════════ -->
    <section id="game" class="hidden">
      <canvas id="particles-game" class="particles"></canvas>
      <div class="hud">
        <div>Difficulty: <span id="difficulty">0</span></div>
        <div id="status"></div>
        <div id="timer">Time: 0.0s</div>
      </div>

      <div class="puzzle-container">
        <div id="puzzle"></div>
        <div id="overlay" class="hidden">
          <div class="overlay-content">
            <h2>Puzzle Complete!</h2>
            <p>Difficulty: <span id="res-diff"></span></p>
            <p>Time: <span id="res-time"></span> s</p>
            <p>Mistakes: <span id="res-mistakes"></span></p>
            <div class="overlay-actions">
              <button id="continue-btn">Continue</button>
              <button id="retry-btn" class="ghost">Retry</button>
            </div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button id="new-btn" class="ghost">Give Up (New Puzzle)</button>
        <button id="logout-btn" class="ghost">Logout</button>
      </div>

      <div id="boards" class="dual">
        <div>
          <h3>🏆 Top 10 (Global)</h3>
          <table>
            <thead><tr><th>User</th><th>Diff</th><th>Time</th><th>Mist</th><th>Result</th></tr></thead>
            <tbody id="global-body"></tbody>
          </table>
        </div>
        <div>
          <h3>👤 Your Last 10</h3>
          <table>
            <thead><tr><th>Diff</th><th>Time</th><th>Mist</th><th>Result</th></tr></thead>
            <tbody id="user-body"></tbody>
          </table>
        </div>
      </div>

      <div class="stats-toggle">
        <button id="show-stats" class="ghost small">📊 View Stats</button>
      </div>

      <button id="mute-btn-game" class="icon-btn">🔊</button>
      <button id="about-btn-game" class="icon-btn">?</button>
    </section>

  </div><!-- .wrap -->

  <!-- ═══════════════════════════════════════════
      TEACHER CLASSROOM DASHBOARD (modal overlay)
  ════════════════════════════════════════════ -->
  <?php if ($role === 'teacher'): ?>
  <div id="dashboard-overlay" class="hidden">
    <div class="dashboard-box">
      <div class="dash-header">
        <h2>🏫 Classroom Dashboard</h2>
        <button id="close-dashboard" class="ghost small">✕ Close</button>
      </div>

      <div id="dash-no-classroom" class="hidden">
        <p style="color:var(--muted); margin-bottom:16px;">You don't have a classroom yet.</p>
        <div style="display:flex; gap:10px; align-items:center; justify-content:center; flex-wrap:wrap;">
          <input type="text" id="classroom-name-input" placeholder="Classroom name (e.g. Class 4B)" style="max-width:220px;"/>
          <button id="create-classroom-btn">Create Classroom</button>
        </div>
      </div>

      <div id="dash-classroom" class="hidden">
        <div class="dash-code-box">
          <p style="color:var(--muted); font-size:.8rem; text-transform:uppercase; letter-spacing:2px; margin:0 0 4px;">Classroom Code · Share this link with students</p>
          <div class="dash-code" id="dash-code-display">------</div>
          <div class="dash-link" id="dash-link-display" style="font-size:.78rem; color:var(--muted); margin-top:6px; cursor:pointer;" title="Click to copy">
            Click to copy student link
          </div>
        </div>

        <!-- Add student -->
        <div class="add-student-row">
          <input type="text" id="new-student-input" placeholder="Student name" style="max-width:200px;"/>
          <button id="add-student-btn" class="small">+ Add Student</button>
        </div>
        <p id="add-student-error" style="color:var(--error); font-size:.85rem; min-height:18px; margin:4px 0 0;"></p>

        <!-- Student list -->
        <div class="student-roster" id="student-roster">
          <p style="color:var(--muted); font-size:.9rem;">No students yet.</p>
        </div>

        <!-- Student scores -->
        <div id="student-scores-section" class="hidden">
          <h4 style="color:var(--magenta); margin: 20px 0 10px;">Recent Activity</h4>
          <div id="student-scores-list"></div>
        </div>
      </div>
    </div>
  </div>
  <?php endif; ?>

  <!-- Multiplayer Overlay -->
  <div id="mp-overlay" class="hidden">
    <div class="mp-box">
      <h2 id="mp-title">Multiplayer</h2>
      <div id="mp-content"></div>
      <div class="mp-actions" id="mp-actions"></div>
    </div>
  </div>

  <!-- Stats section -->
  <section id="stats" class="hidden">
    <h2>Player Statistics</h2>
    <canvas id="progressChart" width="400" height="200"></canvas>
  </section>

  <audio id="chime" src="chime.wav" preload="auto"></audio>
  <audio id="ambient" src="ambient.wav" preload="auto" loop></audio>

  <script src="particles.js"></script>

  <script>
  // ─── PHP → JS bridge ────────────────────────────────
  const PHP_USERNAME       = <?php echo json_encode($username); ?>;
  const PHP_ROLE           = <?php echo json_encode($role); ?>;
  const PHP_CLASSROOM_CODE = <?php echo json_encode($classroom_code); ?>;
  </script>

  <script src="script.js"></script>
</body>
</html>