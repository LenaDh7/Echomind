<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'echomind_db', 3306);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}
header('Content-Type: application/json');

$user = $_GET['username'] ?? '';
if (empty($user)) { echo json_encode([]); exit; }

$stmt = $conn->prepare("SELECT difficulty, completion_time, mistakes, outcome, created_at FROM scores WHERE username = ? ORDER BY created_at ASC");
$stmt->bind_param("s", $user);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
?>