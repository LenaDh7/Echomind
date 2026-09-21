<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code = $_GET['code'] ?? '';

$stmt = $conn->prepare("SELECT * FROM rooms WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows == 0) {
    echo json_encode(["error" => "no room"]);
    exit;
}

$row   = $res->fetch_assoc();
$state = json_decode($row['state_json'] ?? '{}', true);

$bothReady = ($row['ready_host'] == 1 && $row['ready_guest'] == 1);

$out = [
    "host"        => $row['host'],
    "guest"       => $row['guest'],
    "readyHost"   => (bool)$row['ready_host'],
    "readyGuest"  => (bool)$row['ready_guest'],
    "bothReady"   => $bothReady,
    "gameStarted" => (bool)$row['game_started'],
    "mode"        => $row['mode'] ?? 'solo',
    "currentTurn" => $row['current_turn'],
    "roundNumber" => (int)$row['round_number'],
    "pairKey"     => $row['pair_key'],
    // game state fields
    "sequence"    => $state['sequence']    ?? null,
    "difficulty"  => $state['difficulty']  ?? null,
    "cards"       => $state['cards']       ?? null,
    "flipped"     => $state['flipped']     ?? null,
    "matched"     => $state['matched']     ?? null,
    "storyId"     => $state['storyId']     ?? null,
    "subMode"     => $state['subMode']     ?? null,
    "roundResult" => $state['roundResult'] ?? null,
    "gameOver"    => $state['gameOver']    ?? false,
    "playerIndex" => $state['playerIndex'] ?? 0,
    "revealed"    => $state['revealed']    ?? null,
    "lastTile"    => $state['lastTile']    ?? null,
    "correct"     => $state['correct']     ?? null,
    "lastAction"  => $state['lastAction']  ?? null,
    "phase"       => $state['phase']       ?? null,
    "roundOver"   => $state['roundOver']   ?? false,
    "roundWon"    => $state['roundWon']    ?? false,
    "whoFinished" => $state['whoFinished'] ?? null,
    "gridSize"    => $state['gridSize']    ?? null,
    "cols"        => $state['cols']        ?? null,
    "rows"        => $state['rows']        ?? null,
    "coopPuzzle"  => $state['coopPuzzle']  ?? null,
    "coopDiff"    => $state['coopDiff']    ?? null,
];

if ($row['pair_key']) {
    $ps = $conn->prepare("SELECT rounds_won, badges_earned, decorations_json, scene_theme, coop_puzzle, coop_difficulty FROM coop_pairs WHERE pair_key = ?");
    $ps->bind_param("s", $row['pair_key']);
    $ps->execute();
    $pr = $ps->get_result()->fetch_assoc();
    if ($pr) {
        $out['pairProgress'] = [
            "roundsWon"      => (int)$pr['rounds_won'],
            "badgesEarned"   => (int)$pr['badges_earned'],
            "decorations"    => json_decode($pr['decorations_json'] ?? '[]', true),
            "sceneTheme"     => $pr['scene_theme'],
        ];
        $out['pairPuzzle']     = $pr['coop_puzzle'];
        $out['pairDifficulty'] = (int)($pr['coop_difficulty'] ?? 5);
    }
}

echo json_encode($out);