<?php
require_once "db_connect.php";
$res = $conn->query("SELECT username,puzzle_type,difficulty,completion_time,mistakes,outcome
                        FROM scores ORDER BY difficulty DESC, completion_time ASC LIMIT 20");
$data = [];
while($row=$res->fetch_assoc()){ $data[]=$row; }
header('Content-Type: application/json');
echo json_encode($data);
?>