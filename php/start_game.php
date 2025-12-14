<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';

$stmt = $conn->prepare("UPDATE rooms SET game_started=1 WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();

echo json_encode(["ok" => true]);
?>