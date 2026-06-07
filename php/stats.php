<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$user = $_GET['username'] ?? '';
if (empty($user)) { echo json_encode([]); exit; }

$stmt = $conn->prepare("SELECT puzzle_type, difficulty, completion_time, reaction_time, mistakes, outcome, created_at FROM scores WHERE username = ? ORDER BY created_at ASC");
$stmt->bind_param("s", $user);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
?>