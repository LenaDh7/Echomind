<?php
session_start();
include 'php/db_connect.php';

// Ensure email column exists on players
$conn->query("ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(128) UNIQUE");

$message = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username       = trim($_POST['username']);
    $email          = trim($_POST['email']);
    $password       = $_POST['password'];
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $check = $conn->prepare("SELECT email FROM players WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        $message = "error:Email already registered.";
    } else {
        $stmt = $conn->prepare("INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashedPassword);
        if ($stmt->execute()) {
            $message = "success:Account created! Redirecting to login...";
            header("refresh:2;url=login.php");
        } else {
            $message = "error:Something went wrong: " . $stmt->error;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EchoMind - Register</title>
    <link rel="icon" href="icons/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-wrap">
        <div class="auth-box">
            <h1>EchoMind</h1>
            <p class="subtitle">Create your account</p>
            <?php if ($message):
                $parts = explode(":", $message, 2);
                $type  = $parts[0];
                $text  = $parts[1];
            ?>
                <div class="auth-msg <?php echo $type; ?>"><?php echo htmlspecialchars($text); ?></div>
            <?php endif; ?>
            <form method="post">
                <input type="text"  name="username" placeholder="Username" required />
                <input type="email" name="email"    placeholder="Email"    required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit">Create Account</button>
            </form>
            <p class="auth-link">Already have an account? <a href="login.php">Login</a></p>
        </div>
    </div>
</body>
</html>