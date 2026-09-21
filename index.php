<?php
session_start();
require_once "php/db_connect.php";
if (!isset($_SESSION['username'])) { header("Location: login.php"); exit; }
$username            = $_SESSION['username'];
$role                = $_SESSION['role'] ?? 'player';
$classroom_code      = $_SESSION['classroom_code'] ?? null;
$assigned_puzzle     = $_SESSION['assigned_puzzle'] ?? null;
$assigned_difficulty = $_SESSION['assigned_difficulty'] ?? null;
$assigned_prep_time  = $_SESSION['assigned_prep_time'] ?? null;
unset($_SESSION['assigned_puzzle'], $_SESSION['assigned_difficulty'], $_SESSION['assigned_prep_time']);

$session_token = null;
if (($role === 'student') && $classroom_code && $username) {
    $session_token = bin2hex(random_bytes(16));
    $st = $conn->prepare("UPDATE students SET session_token = ?, session_heartbeat = NOW(), is_active = 1 WHERE student_name = ? AND classroom_code = ?");
    $st->bind_param("sss", $session_token, $username, $classroom_code);
    $st->execute();
}

$coop_partner = null;
$coop_theme   = "space";
$coop_puzzle  = "memory";

if ($role === 'student' && $classroom_code && $username) {
    $cq = $conn->prepare(
        "SELECT assigned_coop_partner, assigned_coop_theme, assigned_coop_puzzle
          FROM students
          WHERE student_name = ? AND classroom_code = ?
          LIMIT 1"
    );
    $cq->bind_param("ss", $username, $classroom_code);
    $cq->execute();
    $crow = $cq->get_result()->fetch_assoc();
    if ($crow && !empty($crow['assigned_coop_partner'])) {
        $coop_partner = $crow['assigned_coop_partner'];
        $coop_theme   = $crow['assigned_coop_theme']  ?? 'space';
        $coop_puzzle  = $crow['assigned_coop_puzzle'] ?? 'memory';
    }
}
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

        <div class="puzzle-card" data-puzzle="shape">
          <div class="card-icon">🔷</div>
          <div class="card-title">Shape Memory</div>
          <div class="card-desc">Memorise the cards, then find every matching pair.</div>
        </div>

        <div class="puzzle-card" data-puzzle="story">
          <div class="card-icon">📖</div>
          <div class="card-title">Story Recall</div>
          <div class="card-desc">Listen to a story, then answer questions about it.</div>
        </div>


      </div>

      <div class="slider-section">
        <div class="level-selector">
          <div class="level-label" style="justify-content:center;gap:8px;">
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
          <button id="host-btn" class="ghost small">Host Room</button>
          <button id="join-btn" class="ghost small">Join Room</button>
          <?php if ($role === 'teacher'): ?>
          <button id="open-dashboard-btn" class="ghost small">🏫 My Classroom</button>
          <?php endif; ?>
          <button id="reset-btn" class="ghost small">Reset Progress</button>
          <a href="logout.php" class="ghost small pre-logout-btn">⏻ Logout</a>
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

  <section id="game" class="hidden">
    <canvas id="particles-game" class="particles"></canvas>

    <div class="hud">
      <span>Difficulty: <strong id="difficulty">0</strong></span>
      <span id="status"></span>
      <span id="timer">Time: 0.0s</span>
    </div>

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

    <div class="controls">
      <button id="back-btn"    class="ghost small">← Puzzles</button>
      <button id="giveup-btn"  class="ghost small">↩ Retry</button>
      <button id="logout-btn"  class="ghost small">Logout</button>
      <button id="show-stats"  class="ghost small">📊 Stats</button>
    </div>

    <div id="boards">
      <div class="dual">
        <div>
          <h3>🏆 Top 10 (Global)</h3>
          <table>
            <thead><tr><th>User</th><th>Type</th><th>Diff</th><th>Time</th><th>Mist</th><th>Result</th></tr></thead>
            <tbody id="global-body"></tbody>
          </table>
        </div>
        <div>
          <h3>👤 Your Last 10</h3>
          <table>
            <thead><tr><th>Type</th><th>Diff</th><th>Time</th><th>Mist</th><th>Result</th></tr></thead>
            <tbody id="user-body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <button id="mute-btn-game"  class="icon-btn">🔊</button>
    <button id="about-btn-game" class="icon-btn">?</button>
  </section>

</div>

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

      <div id="dash-tabs" style="display:flex;gap:8px;margin:14px 0 16px;flex-wrap:wrap;">
        <button class="dash-tab-btn ghost small active" data-dtab="manage" style="margin:0;">⚙️ Manage</button>
        <button class="dash-tab-btn ghost small" data-dtab="stats" style="margin:0;">📊 Student Stats</button>
      </div>

      <div id="dash-panel-manage">
        <div class="add-student-row">
          <input type="text" id="new-student-input" placeholder="Student name"/>
          <button id="add-student-btn" class="small">+ Add</button>
        </div>
        <p id="add-student-error" style="color:var(--error);font-size:.82rem;min-height:16px;margin:3px 0 0;"></p>
        <div class="student-roster" id="student-roster">
          <p style="color:var(--muted);font-size:.88rem;">No students yet.</p>
        </div>
      </div>

      <div id="dash-panel-stats" style="display:none">
        <p style="color:var(--muted);font-size:.85rem;margin:0 0 10px;">Tap a student to see their full activity. <span style="color:#c9a6ff;">Co-op</span> games are tagged.</p>
        <div id="stats-student-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;"></div>
        <div id="stats-student-detail"></div>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>

<div id="stats-modal" class="hidden">
  <div class="stats-modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="color:var(--magenta);margin:0;">📊 Player Statistics</h3>
      <button id="stats-modal-close" class="ghost small">✕ Close</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="stats-tab-btn ghost small active" data-tab="memory">🌙 Witchlight Memory</button>
      <button class="stats-tab-btn ghost small" data-tab="shape">🔷 Shape Memory</button>
      <button class="stats-tab-btn ghost small" data-tab="combined">⭐ Combined</button>
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
<script src="story_data.js"></script>
<script src="story_puzzle.js"></script>
<script>
  const PHP_USERNAME          = <?php echo json_encode($username); ?>;
  const PHP_ROLE              = <?php echo json_encode($role); ?>;
  const PHP_CLASSROOM_CODE    = <?php echo json_encode($classroom_code); ?>;
  const PHP_ASSIGNED_PUZZLE   = <?php echo json_encode($assigned_puzzle); ?>;
  const PHP_ASSIGNED_DIFF     = <?php echo json_encode($assigned_difficulty !== null ? (int)$assigned_difficulty : null); ?>;
  const PHP_ASSIGNED_PREP     = <?php echo json_encode($assigned_prep_time  !== null ? (int)$assigned_prep_time  : null); ?>;
  const PHP_SESSION_TOKEN     = <?php echo json_encode($session_token); ?>;
  const PHP_COOP_PARTNER      = <?php echo json_encode($coop_partner); ?>;
  const PHP_COOP_THEME        = <?php echo json_encode($coop_theme); ?>;
  const PHP_COOP_PUZZLE       = <?php echo json_encode($coop_puzzle); ?>;
</script>
<script src="script.js"></script>
</body>
</html>