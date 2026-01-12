<?php
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

header("Content-Type: application/json; charset=utf-8");

include "conexion.php";
$conn = ConcectarBd();

// Manejo básico de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function ($severity, $message, $file, $line) {
  echo json_encode([
    "success" => false,
    "error"   => "$message en $file:$line"
  ]);
  exit;
});

$action = $_GET['action'] ?? 'list';

switch ($action) {

  // 🔹 LISTAR
  case 'list': {
    $query = "SELECT iddeporte, nombre, descripcion, color FROM deporte ORDER BY iddeporte ASC";
    $res   = $conn->query($query);

    if (!$res) {
      echo json_encode([
        "success" => false,
        "error"   => "Error al obtener deportes: " . $conn->error
      ]);
      break;
    }

    $deportes = [];
    while ($row = $res->fetch_assoc()) {
      // casteos simples por si quieres tipar del lado de TS
      $deportes[] = [
        "iddeporte"   => (int)$row["iddeporte"],
        "nombre"      => $row["nombre"],
        "descripcion" => $row["descripcion"],
        "color"       => $row["color"],
      ];
    }

    echo json_encode([
      "success"  => true,
      "deportes" => $deportes
    ]);
    break;
  }

  // 🔹 CREAR
  case 'create': {
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    // Aceptamos tanto 'descripcion' como 'descripción' por compatibilidad
    $nombre      = $conn->real_escape_string($data['nombre'] ?? '');
    $descripcion = $conn->real_escape_string($data['descripcion'] ?? ($data['descripción'] ?? ''));
    $color       = $conn->real_escape_string($data['color'] ?? '');

    if (empty($nombre) || empty($descripcion) || empty($color)) {
      echo json_encode([
        "success" => false,
        "error"   => "Todos los campos son obligatorios"
      ]);
      break;
    }

    $stmt = $conn->prepare("INSERT INTO deporte (nombre, descripcion, color) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nombre, $descripcion, $color);
    $success = $stmt->execute();

    if ($success) {
      echo json_encode([
        "success"    => true,
        "iddeporte"  => $stmt->insert_id,
        "message"    => "Deporte creado correctamente"
      ]);
    } else {
      echo json_encode([
        "success" => false,
        "error"   => "Error al crear deporte: " . $conn->error
      ]);
    }

    $stmt->close();
    break;
  }

  // 🔹 ACTUALIZAR
  case 'update': {
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    $id          = intval($data['iddeporte'] ?? 0);
    $nombre      = $conn->real_escape_string($data['nombre'] ?? '');
    $descripcion = $conn->real_escape_string($data['descripcion'] ?? ($data['descripción'] ?? ''));
    $color       = $conn->real_escape_string($data['color'] ?? '');

    if ($id <= 0) {
      echo json_encode([
        "success" => false,
        "error"   => "ID inválido"
      ]);
      break;
    }

    if (empty($nombre) || empty($descripcion) || empty($color)) {
      echo json_encode([
        "success" => false,
        "error"   => "Todos los campos son obligatorios"
      ]);
      break;
    }

    $stmt = $conn->prepare("UPDATE deporte SET nombre = ?, descripcion = ?, color = ? WHERE iddeporte = ?");
    $stmt->bind_param("sssi", $nombre, $descripcion, $color, $id);
    $success = $stmt->execute();

    if ($success) {
      echo json_encode([
        "success" => true,
        "message" => "Deporte actualizado correctamente"
      ]);
    } else {
      echo json_encode([
        "success" => false,
        "error"   => "Error al actualizar deporte: " . $conn->error
      ]);
    }

    $stmt->close();
    break;
  }

  // 🔹 ELIMINAR
  case 'delete': {
    $id = intval($_GET['iddeporte'] ?? 0);

    if ($id <= 0) {
      echo json_encode([
        "success" => false,
        "error"   => "ID inválido"
      ]);
      break;
    }

    $stmt = $conn->prepare("DELETE FROM deporte WHERE iddeporte = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();

    if ($success) {
      echo json_encode([
        "success" => true,
        "message" => "Deporte eliminado correctamente"
      ]);
    } else {
      echo json_encode([
        "success" => false,
        "error"   => "Error al eliminar deporte: " . $conn->error
      ]);
    }

    $stmt->close();
    break;
  }

  default: {
    echo json_encode([
      "success" => false,
      "error"   => "Acción no válida"
    ]);
  }
}

$conn->close();
?>
