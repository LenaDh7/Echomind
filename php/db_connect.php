<?php
// db_connect.php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "echomind_db";

$conn = new mysqli($host, $user, $pass);
if ($conn->connect_error) { 
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error])); 
}

// Create DB
$conn->query("CREATE DATABASE IF NOT EXISTS $db");
$conn->select_db($db);

/* Players Table */
$conn->query("CREATE TABLE IF NOT EXISTS players(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

/* Scores Table */
$conn->query("CREATE TABLE IF NOT EXISTS scores(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64),
    puzzle_type VARCHAR(32),
    difficulty INT,
    completion_time FLOAT,
    mistakes INT,
    outcome VARCHAR(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

/* Rooms Table */
$conn->query("CREATE TABLE IF NOT EXISTS rooms(
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE,
    puzzle_type VARCHAR(32),
    host VARCHAR(64),
    guest VARCHAR(64),
    state_json TEXT,
    ready_host TINYINT(1) DEFAULT 0,
    ready_guest TINYINT(1) DEFAULT 0,
    game_started TINYINT(1) DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
?>