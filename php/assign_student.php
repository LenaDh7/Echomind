<?php
session_start();
require_once "db_connect.php";
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher = $_SESSION['username'];
$student = $_POST['student_name'] ?? '';
$code    = $_POST['classroom_code'] ?? '';
$puzzle    = $_POST['puzzle']    ?? 'memory';
$diff      = intval($_POST['difficulty'] ?? 5);
$prepTime  = intval($_POST['prep_time']  ?? 45);

if (!$student || !$code) {
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

// Verify classroom belongs to this teacher
$check = $conn->prepare("SELECT id FROM classrooms WHERE classroom_code=? AND teacher_username=?");
$check->bind_param("ss", $code, $teacher);
$check->execute();
if (!$check->get_result()->num_rows) {
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_prep_time INT DEFAULT 45");
$stmt = $conn->prepare("UPDATE students SET assigned_puzzle=?, assigned_difficulty=?, assigned_prep_time=? WHERE classroom_code=? AND student_name=?");
$stmt->bind_param("sisss", $puzzle, $diff, $prepTime, $code, $student);
$stmt->execute();
echo json_encode(["ok" => true]);
?>