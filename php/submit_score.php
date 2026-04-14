<?php
require_once "db_connect.php";

$username  = $_POST['username']       ?? 'Anon';
$puzzle    = $_POST['puzzle_type']    ?? 'memory';
$diff      = intval($_POST['difficulty']   ?? 0);
$time      = floatval($_POST['time']       ?? 0);
$mistakes  = intval($_POST['mistakes']     ?? 0);
$outcome   = $_POST['outcome']        ?? 'incomplete';
$clsCode   = $_POST['classroom_code'] ?? null;

// Treat empty string as null
if ($clsCode === '') $clsCode = null;

$stmt = $conn->prepare(
    "INSERT INTO scores(username, classroom_code, puzzle_type, difficulty, completion_time, mistakes, outcome)
    VALUES (?,?,?,?,?,?,?)"
);
$stmt->bind_param("sssdiis", $username, $clsCode, $puzzle, $diff, $time, $mistakes, $outcome);
$stmt->execute();

echo "ok";
?>