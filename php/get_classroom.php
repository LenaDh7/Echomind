<?php
session_start();
require_once "db_connect.php";
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher = $_SESSION['username'];

// Ensure columns exist
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_prep_time INT DEFAULT 45");
$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS reaction_time FLOAT DEFAULT 0");

// Get ALL classrooms for this teacher
$stmt = $conn->prepare("SELECT classroom_code, classroom_name FROM classrooms WHERE teacher_username = ? ORDER BY created_at ASC");
$stmt->bind_param("s", $teacher);
$stmt->execute();
$res = $stmt->get_result();
$classrooms = [];
while ($row = $res->fetch_assoc()) $classrooms[] = $row;

if (empty($classrooms)) {
    echo json_encode(["classrooms" => [], "classroom" => null, "students" => [], "scores" => []]);
    exit;
}

// Which classroom is selected — use query param or default to first
$selectedCode = $_GET['code'] ?? $classrooms[0]['classroom_code'];
$classroom = null;
foreach ($classrooms as $cl) {
    if ($cl['classroom_code'] === $selectedCode) { $classroom = $cl; break; }
}
if (!$classroom) $classroom = $classrooms[0];
$code = $classroom['classroom_code'];

// Get students
$sts = $conn->prepare("
    SELECT student_name, assigned_puzzle, assigned_difficulty, assigned_prep_time, is_active, created_at
    FROM students WHERE classroom_code = ? ORDER BY student_name ASC
");
$sts->bind_param("s", $code);
$sts->execute();
$sres = $sts->get_result();
$students = [];
while ($row = $sres->fetch_assoc()) $students[] = $row;

// Get recent scores
$scores_map = [];
$sc = $conn->prepare("
    SELECT username, puzzle_type, difficulty, completion_time, reaction_time, mistakes, outcome, created_at
    FROM scores WHERE classroom_code = ? ORDER BY created_at DESC LIMIT 300
");
$sc->bind_param("s", $code);
$sc->execute();
$scres = $sc->get_result();
while ($row = $scres->fetch_assoc()) {
    if (!isset($scores_map[$row['username']])) $scores_map[$row['username']] = [];
    if (count($scores_map[$row['username']]) < 10) $scores_map[$row['username']][] = $row;
}

echo json_encode([
    "classrooms" => $classrooms,
    "classroom"  => $classroom,
    "students"   => $students,
    "scores"     => $scores_map
]);
?>