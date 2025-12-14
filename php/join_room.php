<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';
$user = $_POST['username'] ?? 'Guest';

// Check if room exists
$stmt = $conn->prepare("SELECT * FROM rooms WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows == 0) {
    http_response_code(404);
    echo json_encode(["error" => "Room not found"]);
    exit;
}

// Join the room
$stmt = $conn->prepare("UPDATE rooms SET guest = ? WHERE code = ?");
$stmt->bind_param("ss", $user, $code);
$stmt->execute();

echo json_encode(["status" => "ok"]);
?>