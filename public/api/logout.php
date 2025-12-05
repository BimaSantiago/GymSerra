<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
session_start();
session_unset();
session_destroy();
header("Content-Type: application/json; charset=utf-8");
echo json_encode(["success" => true, "message" => "Sesión cerrada"]);
?>
