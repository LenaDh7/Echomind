<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = $_GET['code'] ?? '';

$stmt = $conn->prepare("SELECT * FROM rooms WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows == 0) { 
    echo json_encode(["error" => "no room"]); 
    exit; 
}

$row = $res->fetch_assoc();
$state = json_decode($row['state_json'] ?? '{}', true);

// Calculate readiness
$bothReady = ($row['ready_host'] == 1 && $row['ready_guest'] == 1);
$otherReady = ($row['ready_host'] == 1 || $row['ready_guest'] == 1);

echo json_encode([
    "sequence"   => $state['sequence'] ?? null,
    "difficulty" => $state['difficulty'] ?? null,
    "host"       => $row['host'],
    "guest"      => $row['guest'],
    "readyHost"  => (bool)$row['ready_host'],
    "readyGuest" => (bool)$row['ready_guest'],
    "bothReady"  => $bothReady,
    "gameStarted"=> (bool)$row['game_started']
]);
?>