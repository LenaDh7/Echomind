<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$playerA   = trim($_POST['player_a']       ?? '');
$playerB   = trim($_POST['player_b']       ?? '');
$pairKey   = trim($_POST['pair_key']       ?? '');
$puzzle    = trim($_POST['puzzle']         ?? 'memory');
$theme     = trim($_POST['scene_theme']    ?? 'space');
$classCode = trim($_POST['classroom_code'] ?? '') ?: null;

if (!$playerA || !$playerB || !$pairKey) {
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

$conn->query("DELETE FROM rooms WHERE pair_key = '" . $conn->real_escape_string($pairKey) . "' AND game_started = 0");

// Generate a unique room code
do {
    $code = substr(str_shuffle("ABCDEFGHJKMNPQRSTUVWXYZ23456789"), 0, 6);
    $check = $conn->prepare("SELECT id FROM rooms WHERE code = ?");
    $check->bind_param("s", $code);
    $check->execute();
    $check->store_result();
} while ($check->num_rows > 0);

$stmt = $conn->prepare(
    "INSERT INTO rooms (code, puzzle_type, host, guest, mode, current_turn, round_number, pair_key, state_json)
    VALUES (?, ?, ?, ?, 'coop', ?, 0, ?, '{}')"
);
$stmt->bind_param("ssssss", $code, $puzzle, $playerA, $playerB, $playerA, $pairKey);
if (!$stmt->execute()) {
    echo json_encode(["error" => $conn->error]);
    exit;
}

$conn->query("ALTER TABLE coop_pairs ADD COLUMN IF NOT EXISTS coop_difficulty INT DEFAULT 5");
$conn->query(
    "INSERT INTO coop_pairs (pair_key, player_a, player_b, classroom_code, scene_theme, coop_puzzle)
    VALUES ('" . $conn->real_escape_string($pairKey) . "',
            '" . $conn->real_escape_string($playerA) . "',
            '" . $conn->real_escape_string($playerB) . "',
            " . ($classCode ? "'" . $conn->real_escape_string($classCode) . "'" : "NULL") . ",
            '" . $conn->real_escape_string($theme) . "',
            '" . $conn->real_escape_string($puzzle) . "')
    ON DUPLICATE KEY UPDATE updated_at = NOW()"
);

$coopDiff   = 5;
$coopPuzzle = $puzzle;
$coopTheme  = $theme;
$sel = $conn->prepare("SELECT coop_difficulty, coop_puzzle, scene_theme FROM coop_pairs WHERE pair_key = ?");
$sel->bind_param("s", $pairKey);
$sel->execute();
if ($prow = $sel->get_result()->fetch_assoc()) {
    $coopDiff   = (int)($prow['coop_difficulty'] ?? 5);
    $coopPuzzle = $prow['coop_puzzle'] ?? $puzzle;
    $coopTheme  = $prow['scene_theme'] ?? $theme;
}

echo json_encode([
    "ok"             => true,
    "code"           => $code,
    "coopDifficulty" => $coopDiff,
    "coopPuzzle"     => $coopPuzzle,
    "sceneTheme"     => $coopTheme
]);
?>