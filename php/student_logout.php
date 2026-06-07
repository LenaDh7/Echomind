<?php
// php/student_logout.php
// Called when a student clicks "Student List" or the back button.
// Releases the DB active-session lock, destroys ONLY the student session,
// then redirects to the classroom name-selection page.
//
// IMPORTANT: if this is somehow called without a student session (e.g. a teacher
// accidentally hits this URL), it does nothing to the session — just redirects home.

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

    // Destroy only this student's PHP session
    session_unset();
    session_destroy();

    // Back to the name-selection screen
    $dest = $code
        ? "../classroom.php?code=" . urlencode($code)
        : "../classroom.php";
    header("Location: $dest");
    exit;
}

// Not a student session — do NOT touch the session (could be a teacher).
// Just redirect to the home page safely.
$fallback = $_COOKIE['echomind_classroom'] ?? null;
if ($fallback) {
    header("Location: ../classroom.php?code=" . urlencode($fallback));
} else {
    header("Location: ../index.php");
}
exit;
?>