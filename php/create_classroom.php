<?php
require_once "db_connect.php";
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$teacher = $_SESSION['username'];
$name    = trim($_POST['classroom_name'] ?? 'My Classroom');

// Check if teacher already has a classroom
$stmt = $conn->prepare("SELECT classroom_code FROM classrooms WHERE teacher_username = ?");
$stmt->bind_param("s", $teacher);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows > 0) {
    $row = $res->fetch_assoc();
    echo json_encode(["code" => $row['classroom_code'], "already_exists" => true]);
    exit;
}

// Generate unique code
do {
    $code = strtoupper(substr(str_shuffle("ABCDEFGHJKMNPQRSTUVWXYZ23456789"), 0, 6));
    $chk  = $conn->prepare("SELECT id FROM classrooms WHERE classroom_code = ?");
    $chk->bind_param("s", $code);
    $chk->execute();
    $chk->store_result();
} while ($chk->num_rows > 0);

$stmt = $conn->prepare("INSERT INTO classrooms (teacher_username, classroom_code, classroom_name) VALUES (?,?,?)");
$stmt->bind_param("sss", $teacher, $code, $name);
$stmt->execute();

echo json_encode(["code" => $code, "name" => $name]);
?>