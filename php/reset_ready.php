<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = trim($_POST['code'] ?? '');
if (!$code) { echo json_encode(["error" => "missing code"]); exit; }

$stmt = $conn->prepare(
    "UPDATE rooms SET ready_host = 0, ready_guest = 0 WHERE code = ?"
);
$stmt->bind_param("s", $code);
$stmt->execute();

echo json_encode(["ok" => true]);
?>