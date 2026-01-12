<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = $_GET["action"] ?? "list";

switch ($action) {
  case "list":
    listHorarios($conn);
    break;
  case "meta":
    metaHorarios($conn);
    break;
  case "create":
    createHorario($conn);
    break;
  case "update":
    updateHorario($conn);
    break;
  case "delete":
    deleteHorario($conn);
    break;
  default:
    echo json_encode([
      "success" => false,
      "error"   => "Acción no válida",
    ]);
    break;
}

$conn->close();
exit;

/**
 * LISTAR HORARIOS
 * Devuelve: idhorario, hora_inicio, hora_fin, dia, iddeporte, idnivel,
 *           deporte (nombre), nivel (nombre_nivel) y color (deporte.color)
 */
function listHorarios(mysqli $conn): void {
  $sql = "
    SELECT
      h.idhorario,
      h.hora_inicio,
      h.hora_fin,
      h.dia,
      h.iddeporte,
      h.idnivel,
      d.nombre       AS deporte,
      d.color        AS color,
      n.nombre_nivel AS nivel
    FROM horarios h
    INNER JOIN deporte d ON d.iddeporte = h.iddeporte
    INNER JOIN nivel   n ON n.idnivel   = h.idnivel
    ORDER BY h.dia ASC, h.hora_inicio ASC, h.idhorario ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener horarios: " . $conn->error,
    ]);
    return;
  }

  $horarios = [];
  while ($row = $res->fetch_assoc()) {
    $horarios[] = [
      "idhorario"   => (int)$row["idhorario"],
      "hora_inicio" => (int)$row["hora_inicio"],
      "hora_fin"    => (int)$row["hora_fin"],
      "dia"         => (int)$row["dia"],
      "iddeporte"   => (int)$row["iddeporte"],
      "idnivel"     => (int)$row["idnivel"],
      "deporte"     => $row["deporte"],
      "nivel"       => $row["nivel"],
      "color"       => $row["color"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "horarios" => $horarios,
  ]);
}

/**
 * META: devuelve deportes y niveles (para llenar Selects)
 */
function metaHorarios(mysqli $conn): void {
  // Deportes
  $sqlDep = "SELECT iddeporte, nombre, color FROM deporte ORDER BY nombre ASC";
  $resDep = $conn->query($sqlDep);
  if (!$resDep) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener deportes: " . $conn->error,
    ]);
    return;
  }

  $deportes = [];
  while ($row = $resDep->fetch_assoc()) {
    $deportes[] = [
      "iddeporte" => (int)$row["iddeporte"],
      "nombre"    => $row["nombre"],
      "color"     => $row["color"],
    ];
  }

  // Niveles
  $sqlNiv = "
    SELECT idnivel, iddeporte, nombre_nivel
    FROM nivel
    ORDER BY iddeporte ASC, nombre_nivel ASC
  ";
  $resNiv = $conn->query($sqlNiv);
  if (!$resNiv) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener niveles: " . $conn->error,
    ]);
    return;
  }

  $niveles = [];
  while ($row = $resNiv->fetch_assoc()) {
    $niveles[] = [
      "idnivel"     => (int)$row["idnivel"],
      "iddeporte"   => (int)$row["iddeporte"],
      "nombre_nivel"=> $row["nombre_nivel"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "deportes" => $deportes,
    "niveles"  => $niveles,
  ]);
}

/**
 * CREAR HORARIO
 * Espera JSON: { hora_inicio, hora_fin, dia, iddeporte, idnivel }
 */
function createHorario(mysqli $conn): void {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];

  $hora_inicio = isset($data["hora_inicio"]) ? (int)$data["hora_inicio"] : 0;
  $hora_fin    = isset($data["hora_fin"])    ? (int)$data["hora_fin"]    : 0;
  $dia         = isset($data["dia"])         ? (int)$data["dia"]         : 0;
  $iddeporte   = isset($data["iddeporte"])   ? (int)$data["iddeporte"]   : 0;
  $idnivel     = isset($data["idnivel"])     ? (int)$data["idnivel"]     : 0;

  if ($hora_inicio <= 0 || $hora_fin <= 0 || $dia <= 0 || $iddeporte <= 0 || $idnivel <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Datos incompletos para crear el horario.",
    ]);
    return;
  }

  $stmt = $conn->prepare("
    INSERT INTO horarios (hora_inicio, hora_fin, dia, idnivel, iddeporte)
    VALUES (?, ?, ?, ?, ?)
  ");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar INSERT: " . $conn->error,
    ]);
    return;
  }

  $stmt->bind_param("iiiii", $hora_inicio, $hora_fin, $dia, $idnivel, $iddeporte);
  $ok = $stmt->execute();

  if ($ok) {
    echo json_encode([
      "success"   => true,
      "message"   => "Horario creado correctamente.",
      "idhorario" => $stmt->insert_id,
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al crear horario: " . $stmt->error,
    ]);
  }

  $stmt->close();
}

/**
 * ACTUALIZAR HORARIO
 * Espera JSON: { idhorario, hora_inicio, hora_fin, dia, iddeporte, idnivel }
 */
function updateHorario(mysqli $conn): void {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];

  $idhorario   = isset($data["idhorario"])   ? (int)$data["idhorario"]   : 0;
  $hora_inicio = isset($data["hora_inicio"]) ? (int)$data["hora_inicio"] : 0;
  $hora_fin    = isset($data["hora_fin"])    ? (int)$data["hora_fin"]    : 0;
  $dia         = isset($data["dia"])         ? (int)$data["dia"]         : 0;
  $iddeporte   = isset($data["iddeporte"])   ? (int)$data["iddeporte"]   : 0;
  $idnivel     = isset($data["idnivel"])     ? (int)$data["idnivel"]     : 0;

  if ($idhorario <= 0 || $hora_inicio <= 0 || $hora_fin <= 0 || $dia <= 0 || $iddeporte <= 0 || $idnivel <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Datos incompletos para actualizar el horario.",
    ]);
    return;
  }

  $stmt = $conn->prepare("
    UPDATE horarios
    SET hora_inicio = ?, hora_fin = ?, dia = ?, idnivel = ?, iddeporte = ?
    WHERE idhorario = ?
  ");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar UPDATE: " . $conn->error,
    ]);
    return;
  }

  $stmt->bind_param("iiiiii", $hora_inicio, $hora_fin, $dia, $idnivel, $iddeporte, $idhorario);
  $ok = $stmt->execute();

  if ($ok) {
    echo json_encode([
      "success" => true,
      "message" => "Horario actualizado correctamente.",
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al actualizar horario: " . $stmt->error,
    ]);
  }

  $stmt->close();
}

/**
 * ELIMINAR HORARIO
 * GET ?action=delete&idhorario=#
 */
function deleteHorario(mysqli $conn): void {
  $idhorario = isset($_GET["idhorario"]) ? (int)$_GET["idhorario"] : 0;

  if ($idhorario <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "ID de horario inválido.",
    ]);
    return;
  }

  $stmt = $conn->prepare("DELETE FROM horarios WHERE idhorario = ?");
  if (!$stmt) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al preparar DELETE: " . $conn->error,
    ]);
    return;
  }

  $stmt->bind_param("i", $idhorario);
  $ok = $stmt->execute();

  if ($ok) {
    echo json_encode([
      "success" => true,
      "message" => "Horario eliminado correctamente.",
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al eliminar horario: " . $stmt->error,
    ]);
  }

  $stmt->close();
}
