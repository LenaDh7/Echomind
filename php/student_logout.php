<?php

session_start();
require_once "db_connect.php";

if (isset($_SESSION['role']) && $_SESSION['role'] === 'student') {
    $name  = $_SESSION['username']       ?? null;
    $code  = $_SESSION['classroom_code'] ?? null;
    $token = $_SESSION['session_token']  ?? null;

    // Release the active-session lock in the database
    if ($name && $code && $token) {
        $stmt = $conn->prepare(
            "UPDATE students SET is_active=0, session_token=NULL
            WHERE classroom_code=? AND student_name=? AND session_token=?"
        );
        $stmt->bind_param("sss", $code, $name, $token);
        $stmt->execute();
    }

    session_unset();
    session_destroy();

    $dest = $code
        ? "../classroom.php?code=" . urlencode($code)
        : "../classroom.php";
    header("Location: $dest");
    exit;
}

$fallback = $_COOKIE['echomind_classroom'] ?? null;
if ($fallback) {
    header("Location: ../classroom.php?code=" . urlencode($fallback));
} else {
    header("Location: ../index.php");
}
exit;
?>