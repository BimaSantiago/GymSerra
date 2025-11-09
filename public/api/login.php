<?php
// login.php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Permitir cookies entre puertos
session_set_cookie_params([
    "httponly" => true,
    "samesite" => "None",
    "secure" => false
]);

session_start();
include "conexion.php";
$conn = ConcectarBd();

$data = json_decode(file_get_contents("php://input"), true);
$username = $data["username"] ?? "";
$password = $data["password"] ?? "";

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Campos vacíos"]);
    exit;
}

// 🔹 Traemos avatar e id desde la BD
$query = $conn->prepare("SELECT iduser, username, avatar FROM users WHERE username = ? AND passw = ?");
$query->bind_param("ss", $username, $password);
$query->execute();
$result = $query->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();

    // Guardamos todos los datos del usuario, incluyendo el avatar
    $_SESSION["auth"] = true;
    $_SESSION["user"] = [
        "iduser" => $user["iduser"],
        "username" => $user["username"],
        "avatar" => !empty($user["avatar"]) ? $user["avatar"] : "uploads/users/default.png"
    ];

    echo json_encode([
        "success" => true,
        "message" => "Inicio de sesión exitoso",
        "user" => $_SESSION["user"]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos"]);
}

$conn->close();
?>
