<?php
require './includes.php';

session_start();
$current_user_id = isset($_SESSION['current_user']) ? $_SESSION['current_user'] : false;
$method = $_SERVER['REQUEST_METHOD'];
$error_message = "";

switch ($method) {
  case "GET":
    if ($current_user_id && !($current_user = Example\User::fetch($current_user_id))) {
      unset($_SESSION['current_user']);
      $current_user_id = false;
    }
    break;
  case "POST":  
    if (isset($_POST['logout'])) {
      unset($_SESSION['current_user']);
      header('Location: login.php');
    } else {
      if ($current_user = Example\User::login(htmlspecialchars($_POST['username']), $_POST['password'])) {
        $current_user_id = $_SESSION['current_user'] = $current_user->id;
      } else {
        $error_message = "Invalid login";
      }
    }
    break;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Login Example</title>
  <link rel="stylesheet" type="text/css" href="css/login.css">
</head>
<body>

<?php 
// No user logged in; show login form
if (!$current_user_id):
?>
  <h1>Login</h1>

  <form action="login.php" method="post">
    <label for="username">Username</label>
    <br>
    <input type="text" name="username" maxlength="32">
    <br>
    <label for="password">Password</label>
    <br>
    <input type="password" name="password">
    <br>
    <input type="submit" value="Log In">
  </form>

<?php
// User logged in; show welcome and logout button
else:
?>
  <h1>Welcome</h1>
  
  <p>You are logged in as <strong><?php echo htmlspecialchars($current_user->username); ?></strong>.</p>
  
  <form action="login.php" method="post">
    <input type="hidden" name="logout" value="1">
    <input type="submit" value="Log Out">
  </form>
  
<?php endif; ?>

  <div class="section error"><?php echo $error_message ?></div>
</body>
</html>