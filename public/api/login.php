<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$input = json_decode(file_get_contents("php://input"), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

$mysqli = new mysqli("localhost", "root", "patitojuan73", "gym_serra_1");

if ($mysqli->connect_error) {
    echo json_encode(["success" => false, "message" => "Error en la conexión"]);
    exit;
}

$stmt = $mysqli->prepare("SELECT iduser, passw FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row['passw'])||$password==$row['passw']) {
        $token = bin2hex(random_bytes(16));
        echo json_encode(["success" => true, "token" => $token]);
    } else {
        echo json_encode(["success" => false, "message" => "Contraseña incorrecta"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
}

$stmt->close();
$mysqli->close();
?>