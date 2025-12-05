<?php
// login.php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Permitir cookies entre puertos
session_set_cookie_params([
    "httponly" => true,
    "samesite" => "None",
    "secure"   => false
]);

session_start();
include "conexion.php";
$conn = ConcectarBd();

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data["username"] ?? "");
$password = trim($data["password"] ?? "");

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Campos vacíos"]);
    exit;
}

/**
 * 1) Buscar usuario por username para revisar estatus, intentos, etc.
 */
$stmt = $conn->prepare("
    SELECT 
        iduser,
        username,
        passw,
        avatar,
        correo,
        rol,
        estatus,
        intentos_fallidos,
        bloqueado_hasta
    FROM users
    WHERE username = ?
");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos"]);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

$now = new DateTime("now");
$bloqueadoHasta = null;
if (!empty($user["bloqueado_hasta"])) {
    try {
        $bloqueadoHasta = new DateTime($user["bloqueado_hasta"]);
    } catch (Exception $e) {
        $bloqueadoHasta = null;
    }
}

/**
 * 2) Verificar si está bloqueado actualmente
 */
if ($user["estatus"] === "bloqueado" && $bloqueadoHasta && $bloqueadoHasta > $now) {
    $segundosRestantes = $bloqueadoHasta->getTimestamp() - $now->getTimestamp();
    if ($segundosRestantes < 0) {
        $segundosRestantes = 0;
    }

    echo json_encode([
        "success" => false,
        "message" => "Tu cuenta está bloqueada. Intenta nuevamente en {$segundosRestantes} segundos."
    ]);
    exit;
}

// Si el tiempo de bloqueo ya pasó, reactivar usuario
if ($user["estatus"] === "bloqueado" && $bloqueadoHasta && $bloqueadoHasta <= $now) {
    $resetStmt = $conn->prepare("
        UPDATE users
        SET estatus = 'activo', intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE iduser = ?
    ");
    $resetStmt->bind_param("i", $user["iduser"]);
    $resetStmt->execute();
    $resetStmt->close();

    $user["estatus"] = "activo";
    $user["intentos_fallidos"] = 0;
    $user["bloqueado_hasta"] = null;
}

/**
 * 3) No permitir login si el usuario está inactivo
 */
if ($user["estatus"] === "inactivo") {
    echo json_encode([
        "success" => false,
        "message" => "Tu usuario está inactivo. Contacta al administrador."
    ]);
    exit;
}

/**
 * 4) Validar contraseña
 * (Actualmente la contraseña está en texto plano en la BD.
 *  Si después quieres usar password_hash/password_verify lo adaptamos.)
 */
$loginCorrecto = ($password === $user["passw"]);

if (!$loginCorrecto) {
    $intentos = (int)$user["intentos_fallidos"] + 1;

    if ($intentos >= 3) {
        // Bloqueo por 1 minuto
        $upd = $conn->prepare("
            UPDATE users
            SET intentos_fallidos = ?, 
                ultimo_intento_login = NOW(),
                bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 1 MINUTE),
                estatus = 'bloqueado'
            WHERE iduser = ?
        ");
        $upd->bind_param("ii", $intentos, $user["iduser"]);
        $upd->execute();
        $upd->close();

        echo json_encode([
            "success" => false,
            "message" => "Has alcanzado el número máximo de intentos. Tu cuenta se ha bloqueado por 1 minuto."
        ]);
    } else {
        $upd = $conn->prepare("
            UPDATE users
            SET intentos_fallidos = ?, 
                ultimo_intento_login = NOW()
            WHERE iduser = ?
        ");
        $upd->bind_param("ii", $intentos, $user["iduser"]);
        $upd->execute();
        $upd->close();

        $restantes = 3 - $intentos;
        echo json_encode([
            "success" => false,
            "message" => "Usuario o contraseña incorrectos. Intentos restantes: {$restantes}."
        ]);
    }

    $conn->close();
    exit;
}

/**
 * 5) Login correcto → Reiniciar intentos y marcar último login
 */
$upd = $conn->prepare("
    UPDATE users
    SET intentos_fallidos = 0,
        ultimo_intento_login = NOW(),
        bloqueado_hasta = NULL,
        estatus = 'activo',
        fecha_ultimo_login = NOW()
    WHERE iduser = ?
");
$upd->bind_param("i", $user["iduser"]);
$upd->execute();
$upd->close();

/**
 * 6) Guardar datos en sesión (incluyendo rol y correo)
 */
$_SESSION["auth"] = true;
$_SESSION["user"] = [
    "iduser"   => $user["iduser"],
    "username" => $user["username"],
    "avatar"   => !empty($user["avatar"]) ? $user["avatar"] : "uploads/users/default.png",
    "correo"   => $user["correo"],
    "rol"      => $user["rol"],
    "estatus"  => "activo"
];

echo json_encode([
    "success" => true,
    "message" => "Inicio de sesión exitoso",
    "user"    => $_SESSION["user"]
]);

$conn->close();
?>
