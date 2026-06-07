<?php
// student_session.php — mark/unmark a student as active
require_once "db_connect.php";
header('Content-Type: application/json');

// Add active_session column if needed
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) DEFAULT NULL");

$action = $_POST['action'] ?? 'check';
$code   = $_POST['classroom_code'] ?? '';
$name   = $_POST['student_name'] ?? '';
$token  = $_POST['token'] ?? '';

if ($action === 'claim') {
    // Check if already active with a different token
    $chk = $conn->prepare("SELECT is_active, session_token FROM students WHERE classroom_code=? AND student_name=?");
    $chk->bind_param("ss", $code, $name);
    $chk->execute();
    $row = $chk->get_result()->fetch_assoc();
    if ($row && $row['is_active'] && $row['session_token'] !== $token) {
        echo json_encode(["ok" => false, "reason" => "already_active"]);
        exit;
    }
    // Claim the session
    $upd = $conn->prepare("UPDATE students SET is_active=1, session_token=? WHERE classroom_code=? AND student_name=?");
    $upd->bind_param("sss", $token, $code, $name);
    $upd->execute();
    echo json_encode(["ok" => true]);

} elseif ($action === 'release') {
    $upd = $conn->prepare("UPDATE students SET is_active=0, session_token=NULL WHERE classroom_code=? AND student_name=? AND session_token=?");
    $upd->bind_param("sss", $code, $name, $token);
    $upd->execute();
    echo json_encode(["ok" => true]);

} elseif ($action === 'check') {
    // Return active status for all students in classroom
    $conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
    $sel = $conn->prepare("SELECT student_name, is_active FROM students WHERE classroom_code=?");
    $sel->bind_param("s", $code);
    $sel->execute();
    $res = $sel->get_result();
    $out = [];
    while ($r = $res->fetch_assoc()) $out[$r['student_name']] = (bool)$r['is_active'];
    echo json_encode($out);
}
?>