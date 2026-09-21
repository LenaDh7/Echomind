<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$partner  = trim($_GET['partner']  ?? '');
$pair_key = trim($_GET['pair_key'] ?? '');

if (!$partner && !$pair_key) {
    echo json_encode(["code" => null]);
    exit;
}

$code = null;

if ($partner) {
    $stmt = $conn->prepare(
        "SELECT code FROM rooms
        WHERE host = ? AND mode = 'coop' AND game_started = 0
        ORDER BY last_update DESC LIMIT 1"
    );
    $stmt->bind_param("s", $partner);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) $code = $row['code'];
}

if (!$code && $pair_key) {
    $stmt2 = $conn->prepare(
        "SELECT code FROM rooms
        WHERE pair_key = ? AND game_started = 0
        ORDER BY last_update DESC LIMIT 1"
    );
    $stmt2->bind_param("s", $pair_key);
    $stmt2->execute();
    $row2 = $stmt2->get_result()->fetch_assoc();
    if ($row2) $code = $row2['code'];
}

echo json_encode(["code" => $code]);
?>