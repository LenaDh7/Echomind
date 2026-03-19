<?php
$conn = new mysqli('127.0.0.1', 'root', '', '', 3306);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Create and select DB first
$conn->query("CREATE DATABASE IF NOT EXISTS echomind_db");
$conn->select_db("echomind_db");

// Now create tables
$conn->query("CREATE TABLE IF NOT EXISTS userdata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64),
    puzzle_type VARCHAR(32),
    difficulty INT,
    completion_time FLOAT,
    mistakes INT,
    outcome VARCHAR(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS rooms (
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