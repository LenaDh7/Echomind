<?php
require_once "db_connect.php";
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher      = $_SESSION['username'];
$student_name = trim($_POST['student_name'] ?? '');
$code         = trim($_POST['classroom_code'] ?? '');

if (!$student_name || !$code) {
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

// Verify this classroom belongs to this teacher
$stmt = $conn->prepare("SELECT id FROM classrooms WHERE classroom_code = ? AND teacher_username = ?");
$stmt->bind_param("ss", $code, $teacher);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows == 0) {
    echo json_encode(["error" => "Classroom not found"]);
    exit;
}

$ins = $conn->prepare("INSERT IGNORE INTO students (classroom_code, student_name) VALUES (?,?)");
$ins->bind_param("ss", $code, $student_name);
$ins->execute();

echo json_encode(["ok" => true, "student" => $student_name]);
?>