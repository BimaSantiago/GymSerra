<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
session_start();
include "conexion.php";
$conn=ConcectarBd();
$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$response = [];

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Campos vacíos"]);
    exit;
}

$query = $conn->prepare("SELECT * FROM users WHERE username = ? AND passw = ?");
$query->bind_param("ss", $username, $password);
$query->execute();
$result = $query->get_result();

if ($result->num_rows > 0) {
    $_SESSION['auth'] = true;
    $_SESSION['username'] = $username;

    echo json_encode([
        "success" => true,
        "message" => "Inicio de sesión exitoso",
        "user" => $username
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos"]);
}

$conn->close();
?>
