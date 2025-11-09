<?php
// check_session.php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    "httponly" => true,
    "samesite" => "None",
    "secure" => false
]);

session_start();

if (!empty($_SESSION["auth"]) && $_SESSION["auth"] === true && !empty($_SESSION["user"])) {
    echo json_encode([
        "authenticated" => true,
        "user" => [
            "iduser" => $_SESSION["user"]["iduser"],
            "username" => $_SESSION["user"]["username"],
            "avatar" => $_SESSION["user"]["avatar"]
        ]
    ]);
} else {
    echo json_encode(["authenticated" => false]);
}
?>
