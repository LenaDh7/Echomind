<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$puzzle   = $_POST['puzzle']   ?? 'memory';
$user     = $_POST['username'] ?? 'Host';
$mode     = $_POST['mode']     ?? 'solo';
$theme    = $_POST['theme']    ?? 'space';

// Generate unique room code
do {
    $code = substr(str_shuffle("ABCDEFGHJKMNPQRSTUVWXYZ23456789"), 0, 6);
    $chk  = $conn->prepare("SELECT id FROM rooms WHERE code = ?");
    $chk->bind_param("s", $code);
    $chk->execute();
    $chk->store_result();
} while ($chk->num_rows > 0);

$stmt = $conn->prepare(
    "INSERT INTO rooms (code, puzzle_type, host, state_json, mode) VALUES (?, ?, ?, '{}', ?)"
);
$stmt->bind_param("ssss", $code, $puzzle, $user, $mode);
$stmt->execute();

if ($stmt->error) {
    echo json_encode(["error" => $stmt->error]);
    exit;
}

echo json_encode(["code" => $code, "mode" => $mode]);