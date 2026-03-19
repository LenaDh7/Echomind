<?php
require_once "db_connect.php"; // Use the shared connection
header('Content-Type: application/json');

// Get the user from the URL, or default to empty
$user = $_GET['username'] ?? '';

if (empty($user)) {
    echo json_encode([]);
    exit;
}

$stmt = $conn->prepare("SELECT puzzle_type, completion_time, mistakes, created_at 
                        FROM scores 
                        WHERE username = ? 
                        ORDER BY created_at ASC");
$stmt->bind_param("s", $user);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>