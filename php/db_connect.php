<?php
$host = "127.0.0.1";
$port = 3306;
$user = "root";
$pass = "";
$db   = "echomind_db";

$conn = new mysqli($host, $user, $pass, "", $port);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$conn->query("CREATE DATABASE IF NOT EXISTS `$db`");
$conn->select_db($db);

/* Players Table */
$conn->query("CREATE TABLE IF NOT EXISTS players(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('player','teacher') DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

/* Classrooms Table */
$conn->query("CREATE TABLE IF NOT EXISTS classrooms(
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_username VARCHAR(64),
    classroom_code VARCHAR(10) UNIQUE,
    classroom_name VARCHAR(128) DEFAULT 'My Classroom',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

/* Students Table (linked to a classroom, no password) */
$conn->query("CREATE TABLE IF NOT EXISTS students(
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_code VARCHAR(10),
    student_name VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student (classroom_code, student_name)
)");

/* Scores Table */
$conn->query("CREATE TABLE IF NOT EXISTS scores(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64),
    classroom_code VARCHAR(10) DEFAULT NULL,
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