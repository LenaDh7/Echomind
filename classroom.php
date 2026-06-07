<?php
require_once "php/db_connect.php";
session_start();

$code = strtoupper(trim($_GET['code'] ?? ''));
$error = '';

if (!$code) {
    die("Invalid classroom link.");
}

// Validate classroom exists
$stmt = $conn->prepare("SELECT classroom_name, teacher_username FROM classrooms WHERE classroom_code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows == 0) {
    die("Classroom not found. Please check your link.");
}
$classroom = $res->fetch_assoc();

// Ensure active session tracking columns exist
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) DEFAULT NULL");

// Get students WITH assignments
$sts = $conn->prepare("
    SELECT student_name, assigned_puzzle, assigned_difficulty, is_active
    FROM students
    WHERE classroom_code = ?
    ORDER BY student_name ASC
");
$sts->bind_param("s", $code);
$sts->execute();
$sres     = $sts->get_result();
$students = [];
while ($row = $sres->fetch_assoc()) {
    $students[] = $row;
}

// Handle submission — log student in and redirect with their assignment
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $chosen = trim($_POST['student_name'] ?? '');
    $matched = null;
    foreach ($students as $s) {
        if ($s['student_name'] === $chosen) { $matched = $s; break; }
    }
    if ($matched) {
        // Block if another session is already active for this student
        if ($matched['is_active']) {
            $error = "This student is already in an active session. Please wait or ask your teacher.";
        } else {
            // Generate a unique token for this session
            $token = bin2hex(random_bytes(16));
            // Claim the session
            $claim = $conn->prepare("UPDATE students SET is_active=1, session_token=? WHERE classroom_code=? AND student_name=?");
            $claim->bind_param("sss", $token, $code, $chosen);
            $claim->execute();
            $_SESSION['username']            = $chosen;
            $_SESSION['classroom_code']      = $code;
            $_SESSION['role']                = 'student';
            $_SESSION['session_token']       = $token;
            $_SESSION['assigned_puzzle']     = $matched['assigned_puzzle']    ?? 'memory';
            $_SESSION['assigned_difficulty'] = $matched['assigned_difficulty'] ?? 0;
            header("Location: index.php");
            exit;
        }
    } else {
        $error = "Please select your name from the list.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>EchoMind — Join Classroom</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css"/>
  <style>
    .join-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .join-box {
      background: rgba(34,11,52,.9);
      border: 1px solid rgba(255,95,203,.2);
      border-radius: 20px;
      padding: 40px 36px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 48px rgba(201,44,255,.25);
    }
    .join-box h1 { margin: 0 0 4px; }
    .join-box .sub { color: var(--muted); margin: 0 0 28px; font-size:.95rem; }
    .student-list { display: flex; flex-direction: column; gap: 10px; margin: 20px 0 24px; text-align: left; }
    .student-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,95,203,.07);
      border: 1px solid rgba(255,95,203,.2);
      border-radius: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all .2s ease;
    }
    .student-item:hover, .student-item.selected {
      background: rgba(255,95,203,.18);
      border-color: var(--magenta);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(255,95,203,.2);
    }
    .student-item .s-name { font-weight: 600; font-size: .95rem; }
    .student-item .s-assign {
      font-size: .75rem;
      color: var(--muted);
      text-align: right;
      line-height: 1.4;
    }
    .student-item.selected .s-assign { color: var(--magenta); }
    .error { color: var(--error); font-size: .9rem; margin: -8px 0 12px; }
    .no-students { color: var(--muted); font-size:.9rem; margin: 20px 0; }
    #enter-btn { width: 100%; opacity: .4; pointer-events: none; transition: opacity .2s; }
    #enter-btn.ready { opacity: 1; pointer-events: auto; }
  </style>
</head>
<body>
<div class="join-wrap">
  <div class="join-box">
    <h1>EchoMind</h1>
    <p class="sub">
      <?php echo htmlspecialchars($classroom['classroom_name']); ?><br>
      <span style="opacity:.6; font-size:.85rem;">Who are you?</span>
    </p>

    <?php if (count($students) === 0): ?>
      <p class="no-students">No students have been added to this classroom yet.<br>Ask your teacher to add you first.</p>
    <?php else: ?>
      <form method="POST">
        <input type="hidden" name="student_name" id="student-hidden" value=""/>
        <div class="student-list">
          <?php foreach ($students as $s):
            $puzzle = $s['assigned_puzzle'] ?? 'memory';
            $diff   = $s['assigned_difficulty'] ?? 0;
            $puzzleLabel = $puzzle === 'shape' ? '🔷 Shape Memory' : '🌙 Witchlight Memory';
            $diffLabel   = $diff > 0 ? "Level $diff" : "Level 0";
          ?>
            <div class="student-item" onclick="selectStudent(this, '<?php echo htmlspecialchars($s['student_name'], ENT_QUOTES); ?>')">
              <span class="s-name">👤 <?php echo htmlspecialchars($s['student_name']); ?></span>
              <span class="s-assign"><?php echo $puzzleLabel; ?><br><?php echo $diffLabel; ?><?php if ($s['is_active']): ?><br><span style="color:#4ade80;font-size:.7rem;">● In session</span><?php endif; ?></span>
            </div>
          <?php endforeach; ?>
        </div>
        <?php if ($error): ?>
          <p class="error"><?php echo htmlspecialchars($error); ?></p>
        <?php endif; ?>
        <button type="submit" id="enter-btn">Begin My Puzzle →</button>
      </form>
    <?php endif; ?>
  </div>
</div>
<script>
function selectStudent(el, name) {
  document.querySelectorAll('.student-item').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('student-hidden').value = name;
  const btn = document.getElementById('enter-btn');
  btn.classList.add('ready');
}
</script>
</body>
</html>