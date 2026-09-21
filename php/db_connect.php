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

$conn->query("CREATE TABLE IF NOT EXISTS players(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('player','teacher') DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS classrooms(
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_username VARCHAR(64),
    classroom_code VARCHAR(10) UNIQUE,
    classroom_name VARCHAR(128) DEFAULT 'My Classroom',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS students(
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_code VARCHAR(10),
    student_name VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student (classroom_code, student_name)
)");

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_puzzle VARCHAR(32) DEFAULT 'memory'");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_difficulty INT DEFAULT 5");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_prep_time INT DEFAULT 45");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS session_heartbeat TIMESTAMP NULL DEFAULT NULL");

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
$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS reaction_time FLOAT DEFAULT 0");
$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_coop TINYINT(1) DEFAULT 0");

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
    mode VARCHAR(16) DEFAULT 'solo',
    current_turn VARCHAR(64) DEFAULT NULL,
    round_number INT DEFAULT 0,
    pair_key VARCHAR(130) DEFAULT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
$conn->query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS mode VARCHAR(16) DEFAULT 'solo'");
$conn->query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_turn VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS round_number INT DEFAULT 0");
$conn->query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pair_key VARCHAR(130) DEFAULT NULL");

$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_puzzle VARCHAR(32) DEFAULT 'memory'");
$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_difficulty INT DEFAULT 5");

$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_partner VARCHAR(64) DEFAULT NULL");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_theme VARCHAR(32) DEFAULT 'space'");
$conn->query("ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_coop_puzzle VARCHAR(32) DEFAULT 'memory'");
$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_puzzle VARCHAR(32) DEFAULT 'memory'");

$conn->query("CREATE TABLE IF NOT EXISTS coop_pairs(
    id INT AUTO_INCREMENT PRIMARY KEY,
    pair_key VARCHAR(130) UNIQUE,
    player_a VARCHAR(64),
    player_b VARCHAR(64),
    classroom_code VARCHAR(10) DEFAULT NULL,
    scene_theme VARCHAR(32) DEFAULT 'space',
    rounds_won INT DEFAULT 0,
    badges_earned INT DEFAULT 0,
    coop_puzzle VARCHAR(32) DEFAULT 'memory',
    coop_difficulty INT DEFAULT 5,
    decorations_json TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");