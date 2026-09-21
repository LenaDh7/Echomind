<?php
require_once "db_connect.php";
header('Content-Type: application/json');

session_start();
if (!isset($_SESSION['username']) || ($_SESSION['role'] ?? '') !== 'teacher') {
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$teacher       = $_SESSION['username'];
$classroomCode = trim($_POST['classroom_code'] ?? '');
$studentA      = trim($_POST['student_a']      ?? '');
$studentB      = trim($_POST['student_b']      ?? '');
$sceneTheme    = trim($_POST['scene_theme']    ?? 'space');
$coopPuzzle    = trim($_POST['coop_puzzle']    ?? 'memory');
if (!in_array($coopPuzzle, ['memory','shape','story'])) $coopPuzzle = 'memory';
$coopDiff      = intval($_POST['coop_difficulty'] ?? 5);
if ($coopDiff < 0)  $coopDiff = 0;
if ($coopDiff > 10) $coopDiff = 10;

if (!$classroomCode || !$studentA || !$studentB || $studentA === $studentB) {
    echo json_encode(["error" => "Invalid pairing"]);
    exit;
}

$chk = $conn->prepare("SELECT id FROM classrooms WHERE classroom_code = ? AND teacher_username = ?");
$chk->bind_param("ss", $classroomCode, $teacher);
$chk->execute();
if (!$chk->get_result()->num_rows) {
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_partner VARCHAR(64) DEFAULT NULL");

$findOldPartner = $conn->prepare("SELECT assigned_coop_partner FROM students WHERE classroom_code = ? AND student_name = ?");
foreach ([$studentA, $studentB] as $who) {
    $findOldPartner->bind_param("ss", $classroomCode, $who);
    $findOldPartner->execute();
    $oldRow = $findOldPartner->get_result()->fetch_assoc();
    $oldPartner = $oldRow['assigned_coop_partner'] ?? null;

    if ($oldPartner && $oldPartner !== $studentA && $oldPartner !== $studentB) {
        $release = $conn->prepare(
            "UPDATE students SET assigned_puzzle = 'memory', assigned_coop_partner = NULL
            WHERE classroom_code = ? AND student_name = ?"
        );
        $release->bind_param("ss", $classroomCode, $oldPartner);
        $release->execute();
    }
}

$players = [$studentA, $studentB];
sort($players);
$pairKey = $players[0] . '|' . $players[1];
$pa = $players[0];
$pb = $players[1];

$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_difficulty INT DEFAULT 5");

$stmt = $conn->prepare(
    "INSERT INTO coop_pairs (pair_key, player_a, player_b, classroom_code, scene_theme, coop_puzzle, coop_difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE scene_theme = VALUES(scene_theme), classroom_code = VALUES(classroom_code), coop_puzzle = VALUES(coop_puzzle), coop_difficulty = VALUES(coop_difficulty)"
);
$stmt->bind_param("ssssssi", $pairKey, $pa, $pb, $classroomCode, $sceneTheme, $coopPuzzle, $coopDiff);
$stmt->execute();

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_partner VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_puzzle VARCHAR(32) DEFAULT 'memory'");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_theme VARCHAR(32) DEFAULT 'space'");

$updA = $conn->prepare("UPDATE students SET assigned_puzzle = 'coop', assigned_coop_partner = ?, assigned_coop_theme = ?, assigned_coop_puzzle = ? WHERE classroom_code = ? AND student_name = ?");
$updA->bind_param("sssss", $studentB, $sceneTheme, $coopPuzzle, $classroomCode, $studentA);
$updA->execute();

$updB = $conn->prepare("UPDATE students SET assigned_puzzle = 'coop', assigned_coop_partner = ?, assigned_coop_theme = ?, assigned_coop_puzzle = ? WHERE classroom_code = ? AND student_name = ?");
$updB->bind_param("sssss", $studentA, $sceneTheme, $coopPuzzle, $classroomCode, $studentB);
$updB->execute();

echo json_encode(["ok" => true, "pairKey" => $pairKey, "theme" => $sceneTheme]);