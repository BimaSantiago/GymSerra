<?php

// 🧩 Encabezados CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }
header("Content-Type: application/json");
include "conexion.php";
$conn=ConcectarBd();
// 🧩 Manejo seguro de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function ($severity, $message, $file, $line) {
  echo json_encode(["success" => false, "error" => "$message en $file:$line"]);
  exit;
});

$action = $_GET['action'] ?? 'list';

switch ($action) {

  // 🔹 LISTAR
  case 'list':
    $query = "SELECT iddeporte, nombre, descripción FROM deporte ORDER BY iddeporte ASC";
    $res = $conn->query($query);
    $deportes = [];
    while ($row = $res->fetch_assoc()) {
      $deportes[] = $row;
    }
    echo json_encode(["success" => true, "deportes" => $deportes]);
    break;

  // 🔹 CREAR
  case 'create':
    $data = json_decode(file_get_contents("php://input"), true);
    $nombre = $conn->real_escape_string($data['nombre'] ?? '');
    $descripcion = $conn->real_escape_string($data['descripción'] ?? '');

    if (empty($nombre) || empty($descripcion)) {
      echo json_encode(["success" => false, "error" => "Todos los campos son obligatorios"]);
      exit;
    }

    $stmt = $conn->prepare("INSERT INTO deporte (nombre, descripción) VALUES (?, ?)");
    $stmt->bind_param("ss", $nombre, $descripcion);
    $success = $stmt->execute();

    echo json_encode(["success" => $success]);
    break;

  // 🔹 ACTUALIZAR
  case 'update':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['iddeporte'] ?? 0);
    $nombre = $conn->real_escape_string($data['nombre'] ?? '');
    $descripcion = $conn->real_escape_string($data['descripción'] ?? '');

    if ($id <= 0) {
      echo json_encode(["success" => false, "error" => "ID inválido"]);
      exit;
    }

    $stmt = $conn->prepare("UPDATE deporte SET nombre=?, descripción=? WHERE iddeporte=?");
    $stmt->bind_param("ssi", $nombre, $descripcion, $id);
    $success = $stmt->execute();

    echo json_encode(["success" => $success]);
    break;

  // 🔹 ELIMINAR
  case 'delete':
    $id = intval($_GET['iddeporte'] ?? 0);
    if ($id <= 0) {
      echo json_encode(["success" => false, "error" => "ID inválido"]);
      exit;
    }

    $stmt = $conn->prepare("DELETE FROM deporte WHERE iddeporte=?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();

    echo json_encode(["success" => $success]);
    break;

  default:
    echo json_encode(["success" => false, "error" => "Acción no válida"]);
}

$conn->close();
?>
