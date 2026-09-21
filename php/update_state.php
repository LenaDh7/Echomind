<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code        = $_POST['code']         ?? '';
$state       = $_POST['state']        ?? '{}';
$currentTurn = $_POST['current_turn'] ?? null;
$roundNumber = isset($_POST['round_number']) ? intval($_POST['round_number']) : null;
$pairKey     = $_POST['pair_key']     ?? null;
$gameStarted = isset($_POST['game_started']) ? intval($_POST['game_started']) : null;

$sets   = ["state_json = ?", "last_update = NOW()"];
$types  = "s";
$params = [&$state];

if ($currentTurn !== null) { $sets[] = "current_turn = ?"; $types .= "s"; $params[] = &$currentTurn; }
if ($roundNumber !== null) { $sets[] = "round_number = ?"; $types .= "i"; $params[] = &$roundNumber; }
if ($pairKey     !== null) { $sets[] = "pair_key = ?";     $types .= "s"; $params[] = &$pairKey; }
if ($gameStarted !== null) { $sets[] = "game_started = ?"; $types .= "i"; $params[] = &$gameStarted; }

$types .= "s";
$params[] = &$code;

$sql  = "UPDATE rooms SET " . implode(", ", $sets) . " WHERE code = ?";
$stmt = $conn->prepare($sql);

$bindArgs = array_merge([$types], $params);
call_user_func_array([$stmt, 'bind_param'], $bindArgs);

if ($stmt->execute()) {
    echo json_encode(["ok" => true]);
} else {
    echo json_encode(["error" => $conn->error]);
}