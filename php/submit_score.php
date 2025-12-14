<?php
require_once "db_connect.php";

$username  = $_POST['username']  ?? 'Anon';
$puzzle    = $_POST['puzzle_type'] ?? 'memory';
$diff      = intval($_POST['difficulty'] ?? 0);
$time      = floatval($_POST['time'] ?? 0);
$mistakes  = intval($_POST['mistakes'] ?? 0);
$outcome   = $_POST['outcome'] ?? 'incomplete';

$stmt = $conn->prepare(
    "INSERT INTO scores(username,puzzle_type,difficulty,completion_time,mistakes,outcome)
        VALUES (?,?,?,?,?,?)"
);
$stmt->bind_param("ssdiis", $username,$puzzle,$diff,$time,$mistakes,$outcome);
$stmt->execute();
echo "ok";
?>
