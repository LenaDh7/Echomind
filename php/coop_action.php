<?php
require_once "db_connect.php";
header('Content-Type: application/json');

$code   = trim($_POST['code']   ?? '');
$player = trim($_POST['player'] ?? '');
$action = trim($_POST['action'] ?? '');

if (!$code || !$player || !$action) {
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

$conn->begin_transaction();
$stmt = $conn->prepare("SELECT * FROM rooms WHERE code = ? FOR UPDATE");
$stmt->bind_param("s", $code);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    $conn->rollback();
    echo json_encode(["error" => "no room"]);
    exit;
}

if ($row['current_turn'] !== $player) {
    $conn->rollback();
    echo json_encode(["error" => "not your turn"]);
    exit;
}

$state = json_decode($row['state_json'] ?? '{}', true) ?: [];
$nextTurn = ($row['host'] === $player) ? $row['guest'] : $row['host'];

switch ($action) {

    case 'flip1': {
        $idx = intval($_POST['idx'] ?? -1);
        $flipped = $state['flipped'] ?? [];
        if ($idx >= 0 && !in_array($idx, $flipped) && count($flipped) < 2) {
            $flipped[] = $idx;
        }
        $state['flipped'] = $flipped;
        $state['phase']   = 'picking';
        break;
    }

    case 'flip2_match': {
        $aIdx = intval($_POST['a_idx']    ?? -1);
        $bIdx = intval($_POST['b_idx']    ?? -1);
        $pairIdx = intval($_POST['pair_idx'] ?? -1);
        $matched = $state['matched'] ?? [];
        if ($pairIdx >= 0 && !in_array($pairIdx, $matched)) {
            $matched[] = $pairIdx;
        }
        $state['matched'] = $matched;
        $state['flipped'] = [$aIdx, $bIdx];
        $state['phase']   = 'matched';
        $conn->query("UPDATE rooms SET state_json = '" . $conn->real_escape_string(json_encode($state)) .
                    "', last_update = NOW() WHERE code = '" . $conn->real_escape_string($code) . "'");
        $conn->commit();
        echo json_encode(["ok" => true, "state" => $state]);
        exit;
    }

    case 'flip2_nomatch': {
        $aIdx = intval($_POST['a_idx'] ?? -1);
        $bIdx = intval($_POST['b_idx'] ?? -1);
        $state['flipped'] = [$aIdx, $bIdx];
        $state['phase']   = 'nomatch';
        $conn->query("UPDATE rooms SET state_json = '" . $conn->real_escape_string(json_encode($state)) .
                    "', last_update = NOW() WHERE code = '" . $conn->real_escape_string($code) . "'");
        $conn->commit();
        echo json_encode(["ok" => true, "state" => $state]);
        exit;
    }

    case 'clear_nomatch': {
        $state['flipped'] = [];
        $state['phase']   = 'idle';
        $upd = $conn->prepare("UPDATE rooms SET state_json = ?, current_turn = ?, last_update = NOW() WHERE code = ?");
        $stateJson = json_encode($state);
        $upd->bind_param("sss", $stateJson, $nextTurn, $code);
        $upd->execute();
        $conn->commit();
        echo json_encode(["ok" => true, "state" => $state, "nextTurn" => $nextTurn]);
        exit;
    }

    case 'pass_turn_after_match': {
        $state['flipped'] = [];
        $state['phase']   = 'idle';
        $upd = $conn->prepare("UPDATE rooms SET state_json = ?, current_turn = ?, last_update = NOW() WHERE code = ?");
        $stateJson = json_encode($state);
        $upd->bind_param("sss", $stateJson, $nextTurn, $code);
        $upd->execute();
        $conn->commit();
        echo json_encode(["ok" => true, "state" => $state, "nextTurn" => $nextTurn]);
        exit;
    }

    case 'tile_click': {
        $idx     = intval($_POST['idx']     ?? -1);
        $correct = intval($_POST['correct'] ?? 0);
        $playerIndex = intval($_POST['player_index'] ?? ($state['playerIndex'] ?? 0));
        $revealed = $state['revealed'] ?? [];
        if ($correct && !in_array($idx, $revealed)) $revealed[] = $idx;

        $state['revealed']    = $revealed;
        $state['playerIndex'] = $correct ? $playerIndex : ($state['playerIndex'] ?? 0);
        $state['lastTile']    = $idx;
        $state['correct']     = (bool)$correct;
        $state['moveSeq']     = ($state['moveSeq'] ?? 0) + 1;

        $upd = $conn->prepare("UPDATE rooms SET state_json = ?, current_turn = ?, last_update = NOW() WHERE code = ?");
        $stateJson = json_encode($state);
        $upd->bind_param("sss", $stateJson, $nextTurn, $code);
        $upd->execute();
        $conn->commit();
        echo json_encode(["ok" => true, "state" => $state, "nextTurn" => $nextTurn]);
        exit;
    }

    default: {
        $conn->rollback();
        echo json_encode(["error" => "unknown action"]);
        exit;
    }
}

$conn->query("UPDATE rooms SET state_json = '" . $conn->real_escape_string(json_encode($state)) .
            "', last_update = NOW() WHERE code = '" . $conn->real_escape_string($code) . "'");
$conn->commit();
echo json_encode(["ok" => true, "state" => $state]);