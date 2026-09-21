<?php
require_once "db_connect.php";

$username      = $_POST['username']       ?? 'Anon';
$puzzle        = $_POST['puzzle_type']    ?? 'memory';
$diff          = intval($_POST['difficulty']    ?? 0);
$time          = floatval($_POST['time']        ?? 0);
$mistakes      = intval($_POST['mistakes']      ?? 0);
$outcome       = $_POST['outcome']        ?? 'incomplete';
$clsCode       = $_POST['classroom_code'] ?? null;
$reactionTime  = floatval($_POST['reaction_time'] ?? 0);

if ($clsCode === '') $clsCode = null;

$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS reaction_time FLOAT DEFAULT 0");

$stmt = $conn->prepare(
    "INSERT INTO scores(username, classroom_code, puzzle_type, difficulty, completion_time, mistakes, outcome, reaction_time)
    VALUES (?,?,?,?,?,?,?,?)"
);
$stmt->bind_param("sssdiisd", $username, $clsCode, $puzzle, $diff, $time, $mistakes, $outcome, $reactionTime);
$stmt->execute();

echo "ok";
?>