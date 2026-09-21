<?php
require_once "db_connect.php";

$action = $_POST['action']        ?? '';
$name   = $_POST['student_name']  ?? '';
$code   = $_POST['classroom_code'] ?? '';
$token  = $_POST['token']         ?? '';

if ($action === 'release' && $name && $code && $token) {
    $stmt = $conn->prepare(
        "UPDATE students
        SET is_active = 0, session_token = NULL
        WHERE classroom_code = ? AND student_name = ? AND session_token = ?"
    );
    $stmt->bind_param("sss", $code, $name, $token);
    $stmt->execute();
}