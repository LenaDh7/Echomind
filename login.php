<?php
session_start();
include 'php/db_connect.php';
$message = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT username, password FROM userdata WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($db_username, $db_password);
    $stmt->fetch();

    if ($stmt->num_rows > 0 && password_verify($password, $db_password)) {
        $_SESSION['email'] = $email;
        $_SESSION['username'] = $db_username;
        header("Location: index.php");
        exit();
    } else {
        $message = "Invalid email or password.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EchoMind — Login</title>
    <link rel="icon" href="icons/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-wrap">
        <div class="auth-box">
            <h1>EchoMind</h1>
            <p class="subtitle">Welcome back, Witchlight</p>
            <?php if ($message): ?>
                <div class="auth-msg error"><?php echo $message; ?></div>
            <?php endif; ?>
            <form method="post">
                <input type="email" name="email" placeholder="Email" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
            <p class="auth-link">No account? <a href="register.php">Register</a></p>
            <p class="auth-link"><a href="resetpassword.php">Forgot password?</a></p>
        </div>
    </div>
</body>
</html>