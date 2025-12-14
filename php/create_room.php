<?php
require_once "db_connect.php";

$code = substr(str_shuffle("ABCDEFGHJKMNPQRSTUVWXYZ23456789"), 0, 6);
$puzzle = $_POST['puzzle'] ?? 'memory';
$user = $_POST['username'] ?? 'Host';

$stmt = $conn->prepare("INSERT INTO rooms (code, puzzle_type, host, state_json) VALUES (?, ?, ?, '{}')");
$stmt->bind_param("sss", $code, $puzzle, $user);
$stmt->execute();

if ($stmt->error) {
    echo json_encode(["error" => $stmt->error]);
    exit;
}

echo json_encode(["code" => $code]);
?>
