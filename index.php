<?php
session_start();
require_once "php/db_connect.php";
if (!isset($_SESSION['username'])) { header("Location: login.php"); exit; }
$username       = $_SESSION['username'];
$role           = $_SESSION['role'] ?? 'player';
$classroom_code = $_SESSION['classroom_code'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>EchoMind — Witchlight Memory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <link rel="icon" href="icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="style.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<div class="wrap">

  <!-- ══════════════════════════════════════
       PUZZLE SELECT SCREEN
  ══════════════════════════════════════ -->
  <section id="prestart">
    <canvas id="particles" class="particles"></canvas>

    <div class="pre-inner">
      <h2>Welcome, <span id="playername"></span></h2>
      <p class="hint">Choose your puzzle and starting level.</p>

      <div class="puzzle-cards">
        <div class="puzzle-card selected" data-puzzle="memory">
          <div class="card-icon">🌙</div>
          <div class="card-title">Witchlight Memory</div>
          <div class="card-desc">Watch the pattern of lights and repeat the sequence.</div>
        </div>
        <div class="puzzle-card locked" data-puzzle="echo">
          <div class="card-icon">🔮</div>
          <div class="card-title">Echo Rhythm</div>
          <div class="card-desc">Coming soon — rhythm-based memory.</div>
          <div class="card-lock">🔒 Coming Soon</div>
        </div>
        <div class="puzzle-card locked" data-puzzle="veil">
          <div class="card-icon">✨</div>
          <div class="card-title">Veil Pattern</div>
          <div class="card-desc">Coming soon — visual pattern matching.</div>
          <div class="card-lock">🔒 Coming Soon</div>
        </div>
      </div>

      <div class="slider-section">
        <div class="level-selector">
          <div class="level-label">
            <span>Starting Level</span>
            <span class="level-value" id="level-display">0</span>
          </div>
          <div class="slider-wrap">
            <input type="range" id="start-level" min="0" max="10" value="0" step="1"/>
            <div class="slider-markers" id="slider-markers"></div>
          </div>
          <div class="level-hint" id="level-hint">3×3 grid · Beginner</div>
        </div>

        <button id="start-btn">Begin Puzzle</button>

        <div class="pre-actions">
          <button id="join-btn" class="ghost small">Join Room</button>
          <?php if ($role === 'teacher'): ?>
          <button id="open-dashboard-btn" class="ghost small">🏫 My Classroom</button>
          <?php endif; ?>
          <button id="reset-btn" class="ghost small">Reset Progress</button>
        </div>
      </div>
    </div>

    <button id="mute-btn-pre"  class="icon-btn">🔊</button>
    <button id="about-btn-pre" class="icon-btn">?</button>

    <div id="about" class="about hidden">
      <div class="about-content">
        <h3>EchoMind: Witchlight Memory</h3>
        <p><em>Created by <strong>Eleni D.</strong></em></p>
        <p>In the quiet hum of the Witchlight, memory becomes ritual.</p>
        <button id="close-about" class="ghost">Close</button>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════
       GAME SCREEN
  ══════════════════════════════════════ -->
  <section id="game" class="hidden">
    <canvas id="particles-game" class="particles"></canvas>

    <!-- HUD -->
    <div class="hud">
      <span>Difficulty: <strong id="difficulty">0</strong></span>
      <span id="status"></span>
      <span id="timer">Time: 0.0s</span>
    </div>

    <!-- Grid + win overlay -->
    <div class="puzzle-container">
      <div id="puzzle"></div>
      <div id="overlay" class="hidden">
        <div class="overlay-content">
          <h2>Puzzle Complete! ✨</h2>
          <p>Difficulty: <span id="res-diff"></span> &nbsp;|&nbsp; Time: <span id="res-time"></span>s &nbsp;|&nbsp; Mistakes: <span id="res-mistakes"></span></p>
          <div class="overlay-actions">
            <button id="continue-btn">Continue</button>
            <button id="retry-btn" class="ghost">Retry</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls always visible below grid -->
    <div class="controls">
      <button id="giveup-btn"  class="ghost small">Give Up</button>
      <button id="logout-btn"  class="ghost small">Logout</button>
      <button id="show-stats"  class="ghost small">📊 Stats</button>
    </div>

    <!-- Leaderboard with internal scroll -->
    <div id="boards">
      <div class="dual">
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
    </div>

    <button id="mute-btn-game"  class="icon-btn">🔊</button>
    <button id="about-btn-game" class="icon-btn">?</button>
  </section>

</div>

<!-- ══════════════════════════════════════
     TEACHER DASHBOARD OVERLAY
══════════════════════════════════════ -->
<?php if ($role === 'teacher'): ?>
<div id="dashboard-overlay" class="hidden">
  <div class="dashboard-box">
    <div class="dash-header">
      <h2>🏫 Classroom Dashboard</h2>
      <button id="close-dashboard" class="ghost small">✕ Close</button>
    </div>
    <div id="dash-no-classroom" style="display:none">
      <p style="color:var(--muted);margin-bottom:14px;">You don't have a classroom yet.</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="classroom-name-input" placeholder="e.g. Class 4B" style="max-width:200px;"/>
        <button id="create-classroom-btn">Create Classroom</button>
      </div>
    </div>
    <div id="dash-classroom" style="display:none">
      <div class="dash-code-box">
        <p style="color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Share this link with students</p>
        <div class="dash-code" id="dash-code-display">------</div>
        <div class="dash-link" id="dash-link-display">Click to copy student link</div>
      </div>
      <div class="add-student-row">
        <input type="text" id="new-student-input" placeholder="Student name"/>
        <button id="add-student-btn" class="small">+ Add</button>
      </div>
      <p id="add-student-error" style="color:var(--error);font-size:.82rem;min-height:16px;margin:3px 0 0;"></p>
      <div class="student-roster" id="student-roster">
        <p style="color:var(--muted);font-size:.88rem;">No students yet.</p>
      </div>
      <div id="student-scores-section" style="display:none">
        <h4 style="color:var(--magenta);margin:18px 0 8px;font-size:.9rem;">Recent Activity</h4>
        <div id="student-scores-list"></div>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Stats modal -->
<div id="stats-modal" class="hidden">
  <div class="stats-modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="color:var(--magenta);margin:0;">📊 Player Statistics</h3>
      <button id="stats-modal-close" class="ghost small">✕ Close</button>
    </div>
    <p id="stats-empty" style="display:none;color:var(--muted);text-align:center;padding:20px 0;">No data yet — play some puzzles first!</p>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">⏱ Completion Time</div>
        <canvas id="chart-time"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">⬆ Difficulty Progress</div>
        <canvas id="chart-diff"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">❌ Mistakes per Game</div>
        <canvas id="chart-mistakes"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">🏆 Outcomes</div>
        <canvas id="chart-outcomes"></canvas>
      </div>
    </div>
  </div>
</div>

<!-- Multiplayer overlay -->
<div id="mp-overlay" class="hidden">
  <div class="mp-box">
    <h2 id="mp-title">Multiplayer</h2>
    <div id="mp-content"></div>
    <div class="mp-actions" id="mp-actions"></div>
  </div>
</div>

<audio id="chime"   src="chime.wav"   preload="auto"></audio>
<audio id="ambient" src="ambient.wav" preload="auto" loop></audio>

<script src="particles.js"></script>
<script>
  const PHP_USERNAME       = <?php echo json_encode($username); ?>;
  const PHP_ROLE           = <?php echo json_encode($role); ?>;
  const PHP_CLASSROOM_CODE = <?php echo json_encode($classroom_code); ?>;
</script>
<script src="script.js"></script>
</body>
</html>