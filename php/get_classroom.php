<?php
session_start();
require_once "db_connect.php";
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher = $_SESSION['username'];

// Get classroom
$stmt = $conn->prepare("SELECT classroom_code, classroom_name FROM classrooms WHERE teacher_username = ?");
$stmt->bind_param("s", $teacher);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows == 0) {
    echo json_encode(["classroom" => null, "students" => []]);
    exit;
}

$classroom = $res->fetch_assoc();
$code      = $classroom['classroom_code'];

// Get students
$sts  = $conn->prepare("SELECT student_name, created_at FROM students WHERE classroom_code = ? ORDER BY student_name ASC");
$sts->bind_param("s", $code);
$sts->execute();
$sres    = $sts->get_result();
$students = [];
while ($row = $sres->fetch_assoc()) {
    $students[] = $row;
}

// Get recent scores per student
$scores_map = [];
$sc = $conn->prepare("
    SELECT username, difficulty, completion_time, mistakes, outcome, created_at
    FROM scores
    WHERE classroom_code = ?
    ORDER BY created_at DESC
    LIMIT 200
");
$sc->bind_param("s", $code);
$sc->execute();
$scres = $sc->get_result();
while ($row = $scres->fetch_assoc()) {
    if (!isset($scores_map[$row['username']])) {
        $scores_map[$row['username']] = [];
    }
    if (count($scores_map[$row['username']]) < 5) {
        $scores_map[$row['username']][] = $row;
    }
}

echo json_encode([
    "classroom" => $classroom,
    "students"  => $students,
    "scores"    => $scores_map
]);
?>