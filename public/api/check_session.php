<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

if (isset($_SESSION['auth']) && $_SESSION['auth'] === true) {
    echo json_encode(["authenticated" => true, "username" => $_SESSION['username']]);
} else {
    echo json_encode(["authenticated" => false]);
}
?>
