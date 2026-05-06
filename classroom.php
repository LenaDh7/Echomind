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

// Get students
$sts = $conn->prepare("SELECT student_name FROM students WHERE classroom_code = ? ORDER BY student_name ASC");
$sts->bind_param("s", $code);
$sts->execute();
$sres     = $sts->get_result();
$students = [];
while ($row = $sres->fetch_assoc()) {
    $students[] = $row['student_name'];
}

// Handle submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $chosen = trim($_POST['student_name'] ?? '');
    if ($chosen && in_array($chosen, $students)) {
        $_SESSION['username']       = $chosen;
        $_SESSION['classroom_code'] = $code;
        $_SESSION['role']           = 'student';
        header("Location: index.php");
        exit;
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
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 48px rgba(201,44,255,.25);
    }
    .join-box h1 { margin: 0 0 4px; }
    .join-box .sub { color: var(--muted); margin: 0 0 28px; font-size:.95rem; }
    .student-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin: 20px 0 28px;
    }
    .student-btn {
      background: rgba(255,95,203,.1);
      border: 1px solid rgba(255,95,203,.3);
      color: var(--text);
      padding: 10px 18px;
      border-radius: 50px;
      cursor: pointer;
      font-size: .95rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      transition: all .2s ease;
      box-shadow: none;
      margin: 0;
    }
    .student-btn:hover, .student-btn.selected {
      background: linear-gradient(135deg, var(--magenta), var(--magenta-d));
      color: #22091f;
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255,95,203,.35);
    }
    .error { color: var(--error); font-size: .9rem; margin: -12px 0 12px; }
    .no-students { color: var(--muted); font-size:.9rem; margin: 20px 0; }
    #selected-display {
      font-size: .85rem;
      color: var(--muted);
      margin-bottom: 12px;
      min-height: 20px;
    }
  </style>
</head>
<body>
<div class="join-wrap">
  <div class="join-box">
    <h1>EchoMind</h1>
    <p class="sub">
      <?php echo htmlspecialchars($classroom['classroom_name']); ?><br>
      <span style="opacity:.6; font-size:.85rem;">Room code: <strong><?php echo $code; ?></strong></span>
    </p>

    <p style="color:var(--muted); margin-bottom:4px;">Who are you?</p>

    <?php if (count($students) === 0): ?>
      <p class="no-students">No students have been added to this classroom yet.<br>Ask your teacher to add you first.</p>
    <?php else: ?>
      <form method="POST">
        <input type="hidden" name="student_name" id="student-hidden" value=""/>
        <div class="student-grid">
          <?php foreach ($students as $s): ?>
            <button type="button" class="student-btn"
              onclick="selectStudent(this, '<?php echo htmlspecialchars($s, ENT_QUOTES); ?>')">
              <?php echo htmlspecialchars($s); ?>
            </button>
          <?php endforeach; ?>
        </div>
        <div id="selected-display"></div>
        <?php if ($error): ?>
          <p class="error"><?php echo htmlspecialchars($error); ?></p>
        <?php endif; ?>
        <button type="submit" id="enter-btn" style="opacity:.4; pointer-events:none; width:100%;">Enter Classroom →</button>
      </form>
    <?php endif; ?>
  </div>
</div>
<script>
function selectStudent(btn, name) {
  document.querySelectorAll('.student-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('student-hidden').value = name;
  document.getElementById('selected-display').textContent = 'Playing as: ' + name;
  const enterBtn = document.getElementById('enter-btn');
  enterBtn.style.opacity = '1';
  enterBtn.style.pointerEvents = 'auto';
}
</script>
</body>
</html>