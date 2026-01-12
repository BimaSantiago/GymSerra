<?php
// check_session.php

header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    "httponly" => true,
    "samesite" => "None",
    "secure"   => false
]);

session_start();

if (!empty($_SESSION["auth"]) && $_SESSION["auth"] === true && !empty($_SESSION["user"])) {
    $user = $_SESSION["user"];

    echo json_encode([
        "authenticated" => true,
        "user" => [
            "iduser"   => $user["iduser"],
            "username" => $user["username"],
            "avatar"   => $user["avatar"],
            "correo"   => $user["correo"] ?? null,
            "rol"      => $user["rol"] ?? null,
            "estatus"  => $user["estatus"] ?? null,
        ]
    ]);
} else {
    echo json_encode(["authenticated" => false]);
}
?>
