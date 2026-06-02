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
$puzzle  = $_POST['puzzle'] ?? 'memory';
$diff    = intval($_POST['difficulty'] ?? 5);

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

$stmt = $conn->prepare("UPDATE students SET assigned_puzzle=?, assigned_difficulty=? WHERE classroom_code=? AND student_name=?");
$stmt->bind_param("siss", $puzzle, $diff, $code, $student);
$stmt->execute();
echo json_encode(["ok" => true]);
?>