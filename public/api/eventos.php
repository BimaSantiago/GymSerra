<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include 'conexion.php';
$conn = ConcectarBd();

// Opcional: log de errores a archivo, sin romper JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

$action = $_GET['action'] ?? 'list';

switch ($action) {
  case 'list':
    listEventos($conn);
    break;

  case 'create':
    createEvento($conn);
    break;

  case 'update':
    updateEvento($conn);
    break;

  case 'delete':
    deleteEvento($conn);
    break;

  default:
    echo json_encode([
      "success" => false,
      "error"   => "Acción no válida."
    ]);
    break;
}

$conn->close();
exit;


/**
 * LISTAR EVENTOS
 * Devuelve: idevento, fechas, ubicacion (alias de descripcion), iddeporte, deporte, color
 */
function listEventos($conn) {
  $sql = "
    SELECT 
      e.idevento,
      e.fecha_inicio,
      e.fecha_fin,
      e.descripcion AS ubicacion,
      e.iddeporte,
      d.nombre AS deporte,
      d.color AS color
    FROM eventos e
    INNER JOIN deporte d ON e.iddeporte = d.iddeporte
    ORDER BY e.fecha_inicio ASC, e.idevento ASC
  ";

  $res = $conn->query($sql);

  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener eventos: " . $conn->error
    ]);
    return;
  }

  $eventos = [];
  while ($row = $res->fetch_assoc()) {
    $eventos[] = [
      "idevento"     => (int)$row["idevento"],
      "fecha_inicio" => $row["fecha_inicio"],
      "fecha_fin"    => $row["fecha_fin"],
      "ubicacion"    => $row["ubicacion"],
      "iddeporte"    => (int)$row["iddeporte"],
      "deporte"      => $row["deporte"],
      "color"        => $row["color"],
    ];
  }

  echo json_encode([
    "success" => true,
    "eventos" => $eventos
  ]);
}


/**
 * CREAR EVENTO
 * Espera JSON: { fecha_inicio, fecha_fin, ubicacion, iddeporte }
 * 'ubicacion' se guarda en la columna 'descripcion'
 */
function createEvento($conn) {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];

  $fecha_inicio = trim($data['fecha_inicio'] ?? '');
  $fecha_fin    = trim($data['fecha_fin'] ?? '');
  $ubicacion    = trim($data['ubicacion'] ?? '');
  $iddeporte    = isset($data['iddeporte']) ? (int)$data['iddeporte'] : 0;

  if ($fecha_inicio === '' || $fecha_fin === '' || $ubicacion === '' || $iddeporte <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Todos los campos son obligatorios."
    ]);
    return;
  }

  $fecha_inicio_esc = $conn->real_escape_string($fecha_inicio);
  $fecha_fin_esc    = $conn->real_escape_string($fecha_fin);
  $descripcion_esc  = $conn->real_escape_string($ubicacion);

  $stmt = $conn->prepare("
    INSERT INTO eventos (fecha_inicio, fecha_fin, descripcion, iddeporte)
    VALUES (?, ?, ?, ?)
  ");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar INSERT: " . $conn->error
    ]);
    return;
  }

  $stmt->bind_param("sssi", $fecha_inicio_esc, $fecha_fin_esc, $descripcion_esc, $iddeporte);
  $success = $stmt->execute();

  if ($success) {
    echo json_encode([
      "success"  => true,
      "message"  => "Evento creado correctamente.",
      "idevento" => $stmt->insert_id
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al crear evento: " . $stmt->error
    ]);
  }

  $stmt->close();
}


/**
 * ACTUALIZAR EVENTO
 * Espera JSON: { idevento, fecha_inicio, fecha_fin, ubicacion, iddeporte }
 */
function updateEvento($conn) {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];

  $idevento     = isset($data['idevento']) ? (int)$data['idevento'] : 0;
  $fecha_inicio = trim($data['fecha_inicio'] ?? '');
  $fecha_fin    = trim($data['fecha_fin'] ?? '');
  $ubicacion    = trim($data['ubicacion'] ?? '');
  $iddeporte    = isset($data['iddeporte']) ? (int)$data['iddeporte'] : 0;

  if ($idevento <= 0 || $fecha_inicio === '' || $fecha_fin === '' || $ubicacion === '' || $iddeporte <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Datos incompletos para actualizar el evento."
    ]);
    return;
  }

  $fecha_inicio_esc = $conn->real_escape_string($fecha_inicio);
  $fecha_fin_esc    = $conn->real_escape_string($fecha_fin);
  $descripcion_esc  = $conn->real_escape_string($ubicacion);

  $stmt = $conn->prepare("
    UPDATE eventos
    SET fecha_inicio = ?, fecha_fin = ?, descripcion = ?, iddeporte = ?
    WHERE idevento = ?
  ");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar UPDATE: " . $conn->error
    ]);
    return;
  }

  $stmt->bind_param("sssii", $fecha_inicio_esc, $fecha_fin_esc, $descripcion_esc, $iddeporte, $idevento);
  $success = $stmt->execute();

  if ($success) {
    echo json_encode([
      "success" => true,
      "message" => "Evento actualizado correctamente."
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al actualizar evento: " . $stmt->error
    ]);
  }

  $stmt->close();
}


/**
 * ELIMINAR EVENTO
 * GET ?action=delete&idevento=#
 */
function deleteEvento($conn) {
  $idevento = isset($_GET['idevento']) ? (int)$_GET['idevento'] : 0;

  if ($idevento <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "ID de evento no válido."
    ]);
    return;
  }

  $stmt = $conn->prepare("DELETE FROM eventos WHERE idevento = ?");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar DELETE: " . $conn->error
    ]);
    return;
  }

  $stmt->bind_param("i", $idevento);
  $success = $stmt->execute();

  echo json_encode([
    "success" => $success,
    "message" => $success ? "Evento eliminado correctamente." : "Error al eliminar el evento."
  ]);

  $stmt->close();
}
