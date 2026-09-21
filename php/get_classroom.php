<?php
session_start();
require_once "db_connect.php";
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher = $_SESSION['username'];

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_prep_time INT DEFAULT 45");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_partner VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_theme VARCHAR(32) DEFAULT 'space'");
$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS reaction_time FLOAT DEFAULT 0");
$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_coop TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_difficulty INT DEFAULT 5");

$stmt = $conn->prepare("SELECT classroom_code, classroom_name FROM classrooms WHERE teacher_username = ? ORDER BY created_at ASC");
$stmt->bind_param("s", $teacher);
$stmt->execute();
$res = $stmt->get_result();
$classrooms = [];
while ($row = $res->fetch_assoc()) $classrooms[] = $row;

if (empty($classrooms)) {
    echo json_encode(["classrooms" => [], "classroom" => null, "students" => [], "scores" => [], "coop_pairs" => []]);
    exit;
}

$selectedCode = $_GET['code'] ?? $classrooms[0]['classroom_code'];
$classroom = null;
foreach ($classrooms as $cl) {
    if ($cl['classroom_code'] === $selectedCode) { $classroom = $cl; break; }
}
if (!$classroom) $classroom = $classrooms[0];
$code = $classroom['classroom_code'];

$sts = $conn->prepare("
    SELECT student_name, assigned_puzzle, assigned_difficulty, assigned_prep_time,
            assigned_coop_partner, assigned_coop_theme, is_active, created_at
    FROM students WHERE classroom_code = ? ORDER BY student_name ASC
");
$sts->bind_param("s", $code);
$sts->execute();
$sres = $sts->get_result();
$students = [];
while ($row = $sres->fetch_assoc()) $students[] = $row;

$scores_map = [];
$sc = $conn->prepare("
    SELECT username, puzzle_type, difficulty, completion_time, reaction_time, mistakes, outcome, is_coop, created_at
    FROM scores WHERE classroom_code = ? ORDER BY created_at DESC LIMIT 300
");
$sc->bind_param("s", $code);
$sc->execute();
$scres = $sc->get_result();
while ($row = $scres->fetch_assoc()) {
    if (!isset($scores_map[$row['username']])) $scores_map[$row['username']] = [];
    if (count($scores_map[$row['username']]) < 10) $scores_map[$row['username']][] = $row;
}

$coop_pairs = [];
$ps = $conn->prepare("
    SELECT pair_key, player_a, player_b, scene_theme, coop_puzzle, coop_difficulty, rounds_won, badges_earned, decorations_json
    FROM coop_pairs WHERE classroom_code = ? ORDER BY updated_at DESC
");
$ps->bind_param("s", $code);
$ps->execute();
$pres = $ps->get_result();
while ($pr = $pres->fetch_assoc()) {
    $pr['decorations'] = json_decode($pr['decorations_json'] ?? '[]', true);
    unset($pr['decorations_json']);
    $coop_pairs[] = $pr;
}

echo json_encode([
    "classrooms" => $classrooms,
    "classroom"  => $classroom,
    "students"   => $students,
    "scores"     => $scores_map,
    "coop_pairs" => $coop_pairs
]);
?>