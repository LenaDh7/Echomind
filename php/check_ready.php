<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';
$username = $_POST['username'] ?? '';

// Find who this user is (host or guest)
$stmt = $conn->prepare("SELECT host, guest FROM rooms WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows == 0) { 
    echo json_encode(["error" => "no room"]); 
    exit; 
}

$row = $res->fetch_assoc();

if ($username === $row['host']) {
    $upd = $conn->prepare("UPDATE rooms SET ready_host=1 WHERE code = ?");
    $upd->bind_param("s", $code);
    $upd->execute();
} else if ($username === $row['guest']) {
    $upd = $conn->prepare("UPDATE rooms SET ready_guest=1 WHERE code = ?");
    $upd->bind_param("s", $code);
    $upd->execute();
}

echo json_encode(["ok" => true]);
?>