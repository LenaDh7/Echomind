<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$pairKey       = trim($_POST['pair_key']       ?? '');
$playerA       = trim($_POST['player_a']       ?? '');
$playerB       = trim($_POST['player_b']       ?? '');
$classroomCode = trim($_POST['classroom_code'] ?? '') ?: null;
$sceneTheme    = trim($_POST['scene_theme']    ?? 'space');
$won           = intval($_POST['won']          ?? 1);

if (!$pairKey || !$playerA || !$playerB) {
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

$conn->query("INSERT INTO coop_pairs (pair_key, player_a, player_b, classroom_code, scene_theme)
                VALUES ('$pairKey', '$playerA', '$playerB', " .
                ($classroomCode ? "'$classroomCode'" : "NULL") .
                ", '$sceneTheme')
                ON DUPLICATE KEY UPDATE updated_at = NOW()");

$sel = $conn->prepare("SELECT rounds_won, badges_earned, decorations_json FROM coop_pairs WHERE pair_key = ?");
$sel->bind_param("s", $pairKey);
$sel->execute();
$row = $sel->get_result()->fetch_assoc();

$roundsWon    = (int)$row['rounds_won']    + ($won ? 1 : 0);
$badgesEarned = (int)$row['badges_earned'];
$decorations  = json_decode($row['decorations_json'] ?? '[]', true);

$newBadges = floor($roundsWon / 5) - $badgesEarned;
if ($newBadges > 0) {
    $badgesEarned += $newBadges;
    for ($i = 0; $i < $newBadges; $i++) {
        $nextSlot = count($decorations);
        if ($nextSlot < 10) {
            $decorations[] = $nextSlot;
        }
    }
}

$decorJson = json_encode($decorations);
$upd = $conn->prepare(
    "UPDATE coop_pairs SET rounds_won = ?, badges_earned = ?, decorations_json = ?, scene_theme = ?
    WHERE pair_key = ?"
);
$upd->bind_param("iisss", $roundsWon, $badgesEarned, $decorJson, $sceneTheme, $pairKey);
$upd->execute();

$conn->query("ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_coop TINYINT(1) DEFAULT 0");

$coopPuzzle = 'memory';
$coopDiff   = 5;
$pq = $conn->prepare("SELECT coop_puzzle, coop_difficulty FROM coop_pairs WHERE pair_key = ?");
$pq->bind_param("s", $pairKey);
$pq->execute();
if ($pqr = $pq->get_result()->fetch_assoc()) {
    $coopPuzzle = $pqr['coop_puzzle'] ?? 'memory';
    $coopDiff   = (int)($pqr['coop_difficulty'] ?? 5);
}

$completionTime = floatval($_POST['completion_time'] ?? 0);
$mistakes       = intval($_POST['mistakes'] ?? 0);
$outcome        = $won ? 'win' : 'loss';

$logStmt = $conn->prepare(
    "INSERT INTO scores (username, classroom_code, puzzle_type, difficulty, completion_time, mistakes, outcome, is_coop)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
);
foreach ([$playerA, $playerB] as $player) {
    $logStmt->bind_param(
        "sssidis",
        $player, $classroomCode, $coopPuzzle, $coopDiff, $completionTime, $mistakes, $outcome
    );
    $logStmt->execute();
}

echo json_encode([
    "ok"           => true,
    "roundsWon"    => $roundsWon,
    "badgesEarned" => $badgesEarned,
    "decorations"  => $decorations,
    "sceneTheme"   => $sceneTheme,
    "newBadge"     => $newBadges > 0
]);