<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code  = $_POST['code'] ?? '';
$state = $_POST['state'] ?? '{}';

$stmt = $conn->prepare("UPDATE rooms SET state_json = ?, last_update = NOW() WHERE code = ?");
$stmt->bind_param("ss", $state, $code);

if($stmt->execute()) {
    echo json_encode(["ok" => true]);
} else {
    echo json_encode(["error" => $conn->error]);
}
?>