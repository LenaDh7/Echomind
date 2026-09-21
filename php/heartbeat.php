<?php
require_once "db_connect.php";

$name  = $_POST['student_name']  ?? '';
$code  = $_POST['classroom_code'] ?? '';
$token = $_POST['token']          ?? '';

if (!$name || !$code || !$token) exit;

$stmt = $conn->prepare(
    "UPDATE students SET session_heartbeat = NOW()
    WHERE classroom_code = ? AND student_name = ? AND session_token = ? AND is_active = 1"
);
$stmt->bind_param("sss", $code, $name, $token);
$stmt->execute();
?>