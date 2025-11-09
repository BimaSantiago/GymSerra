<?php
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
include "conexion.php";
$conn = ConcectarBd();

$action = $_GET["action"] ?? $_POST["action"] ?? null;

if ($action === "get_current") {
    if (!empty($_SESSION["auth"]) && $_SESSION["auth"] === true && !empty($_SESSION["user"])) {
        $user = $_SESSION["user"];

        // Si el avatar está vacío o se modificó en la base de datos, recargamos desde DB
        if (empty($user["avatar"])) {
            $iduser = $user["iduser"];
            $query = $conn->prepare("SELECT avatar FROM users WHERE iduser = ?");
            $query->bind_param("i", $iduser);
            $query->execute();
            $result = $query->get_result();
            if ($row = $result->fetch_assoc()) {
                $user["avatar"] = $row["avatar"];
                $_SESSION["user"]["avatar"] = $row["avatar"];
            }
        }

        echo json_encode([
            "success" => true,
            "user" => [
                "iduser" => $user["iduser"],
                "username" => $user["username"],
                "avatar" => !empty($user["avatar"]) ? $user["avatar"] : "uploads/users/default.png"
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No active session"
        ]);
    }
    exit;
}


function json_ok($data) {
  echo json_encode(["success" => true] + $data);
  exit;
}
function json_err($msg) {
  echo json_encode(["success" => false, "error" => $msg]);
  exit;
}

// Ruta donde se guardarán los avatars
$uploadDir = __DIR__ . "/../uploads/users/";
$relativePath = "uploads/users/";

// Crear carpeta si no existe
if (!file_exists($uploadDir)) {
  mkdir($uploadDir, 0777, true);
}


switch ($action) {
  /* === LIST === */
  case "list": {
    $page = intval($_GET["page"] ?? 1);
    $limit = intval($_GET["limit"] ?? 10);
    $offset = ($page - 1) * $limit;
    $search = mysqli_real_escape_string($conn, $_GET["search"] ?? "");

    $where = $search ? "WHERE username LIKE '%$search%'" : "";

    $total = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS total FROM users $where"))["total"];
    $res = mysqli_query($conn, "SELECT * FROM users $where ORDER BY iduser DESC LIMIT $limit OFFSET $offset");

    $users = [];
    while ($row = mysqli_fetch_assoc($res)) {
      // Si existe avatar, agregamos la URL completa accesible desde el frontend
      if (!empty($row["avatar"])) {
        $row["avatar"] = $relativePath . basename($row["avatar"]);
      }
      $users[] = $row;
    }

    json_ok(["users" => $users, "total" => intval($total)]);
  }

  /* === CREATE === */
  case "create": {
    $username = mysqli_real_escape_string($conn, $_POST["username"]);
    $passw = mysqli_real_escape_string($conn, $_POST["passw"]);
    $avatarPath = "";

    if (isset($_FILES["avatar"]) && $_FILES["avatar"]["error"] === UPLOAD_ERR_OK) {
      $ext = strtolower(pathinfo($_FILES["avatar"]["name"], PATHINFO_EXTENSION));
      $fileName = uniqid("user_") . "." . $ext;
      $filePath = $uploadDir . $fileName;

      if (move_uploaded_file($_FILES["avatar"]["tmp_name"], $filePath)) {
        $avatarPath = $relativePath . $fileName;
      } else {
        json_err("Error al mover el archivo al servidor");
      }
    }

    $sql = "INSERT INTO users (username, passw, avatar) VALUES ('$username', '$passw', '$avatarPath')";
    if (mysqli_query($conn, $sql)) {
      json_ok(["msg" => "Usuario creado correctamente"]);
    } else {
      json_err("Error al guardar: " . mysqli_error($conn));
    }
  }

  /* === GET === */
  case "get": {
    $id = intval($_GET["iduser"] ?? 0);
    $res = mysqli_query($conn, "SELECT * FROM users WHERE iduser=$id");
    if ($row = mysqli_fetch_assoc($res)) {
      if (!empty($row["avatar"])) {
        $row["avatar"] = $relativePath . basename($row["avatar"]);
      }
      json_ok(["user" => $row]);
    } else {
      json_err("Usuario no encontrado");
    }
  }

  /* === UPDATE === */
  case "update": {
    $id = intval($_POST["iduser"]);
    $username = mysqli_real_escape_string($conn, $_POST["username"]);
    $passw = mysqli_real_escape_string($conn, $_POST["passw"]);

    $res = mysqli_query($conn, "SELECT avatar FROM users WHERE iduser=$id");
    $row = mysqli_fetch_assoc($res);
    $avatarPath = $row["avatar"] ?? "";

    if (isset($_FILES["avatar"]) && $_FILES["avatar"]["error"] === UPLOAD_ERR_OK) {
      $ext = strtolower(pathinfo($_FILES["avatar"]["name"], PATHINFO_EXTENSION));
      $fileName = uniqid("user_") . "." . $ext;
      $filePath = $uploadDir . $fileName;

      if (move_uploaded_file($_FILES["avatar"]["tmp_name"], $filePath)) {
        // Borrar imagen anterior
        if (!empty($avatarPath) && file_exists(__DIR__ . "/../" . $avatarPath)) {
          unlink(__DIR__ . "/../" . $avatarPath);
        }
        $avatarPath = $relativePath . $fileName;
      } else {
        json_err("Error al subir la nueva imagen");
      }
    }

    $sql = "UPDATE users SET username='$username', passw='$passw', avatar='$avatarPath' WHERE iduser=$id";
    if (mysqli_query($conn, $sql)) {
      json_ok(["msg" => "Usuario actualizado correctamente"]);
    } else {
      json_err("Error al actualizar: " . mysqli_error($conn));
    }
  }

  /* === DELETE === */
  case "delete": {
    $id = intval($_GET["iduser"] ?? 0);
    $res = mysqli_query($conn, "SELECT avatar FROM users WHERE iduser=$id");
    $row = mysqli_fetch_assoc($res);
    if (!empty($row["avatar"]) && file_exists(__DIR__ . "/../../" . $row["avatar"])) {
      unlink(__DIR__ . "/../../" . $row["avatar"]);
    }
    if (mysqli_query($conn, "DELETE FROM users WHERE iduser=$id")) {
      json_ok(["msg" => "Usuario eliminado"]);
    } else {
      json_err("Error al eliminar: " . mysqli_error($conn));
    }
  }

  default:
    json_err("Acción no válida");
}

mysqli_close($conn);
?>
