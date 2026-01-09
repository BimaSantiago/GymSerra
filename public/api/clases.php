<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = $_GET["action"] ?? "";

switch ($action) {
  case "deportes":
    getDeportes($conn);
    break;
  case "planes":
    getPlanes($conn);
    break;
  case "horarios":
    getHorarios($conn);
    break;
  case "instructores":
    getInstructores($conn);
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
 * OBTENER DEPORTES
 * Devuelve todos los deportes con su información básica
 */
function getDeportes(mysqli $conn): void {
  $sql = "
    SELECT 
      iddeporte,
      nombre,
      descripcion,
      color
    FROM deporte
    ORDER BY nombre DESC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener deportes: " . $conn->error,
    ]);
    return;
  }

  $deportes = [];
  while ($row = $res->fetch_assoc()) {
    $deportes[] = [
      "iddeporte"  => (int)$row["iddeporte"],
      "nombre"     => $row["nombre"],
      "descripcion"=> $row["descripcion"],
      "color"      => $row["color"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "deportes" => $deportes,
  ]);
}

/**
 * OBTENER PLANES DE PAGO
 * Devuelve todos los planes con información del deporte
 */
function getPlanes(mysqli $conn): void {
  $sql = "
    SELECT 
      p.idplan,
      p.iddeporte,
      d.nombre AS deporte,
      p.dias_por_semana,
      p.costo,
      p.costo_promocion,
      p.costo_penalizacion
    FROM plan_pago p
    INNER JOIN deporte d ON d.iddeporte = p.iddeporte
    ORDER BY p.iddeporte ASC, p.dias_por_semana ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener planes: " . $conn->error,
    ]);
    return;
  }

  $planes = [];
  while ($row = $res->fetch_assoc()) {
    $planes[] = [
      "idplan"             => (int)$row["idplan"],
      "iddeporte"          => (int)$row["iddeporte"],
      "deporte"            => $row["deporte"],
      "dias_por_semana"    => (int)$row["dias_por_semana"],
      "costo"              => (float)$row["costo"],
      "costo_promocion"    => (float)$row["costo_promocion"],
      "costo_penalizacion" => (float)$row["costo_penalizacion"],
    ];
  }

  echo json_encode([
    "success" => true,
    "planes"  => $planes,
  ]);
}

/**
 * OBTENER HORARIOS
 * Devuelve todos los horarios con información del deporte y nivel
 */
function getHorarios(mysqli $conn): void {
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
 * OBTENER INSTRUCTORES ACTIVOS
 * Devuelve solo instructores con estado 'Activo'
 */
function getInstructores(mysqli $conn): void {
  $sql = "
    SELECT
      i.idinstructor,
      i.iddeporte,
      i.nombre,
      i.appaterno,
      i.apmaterno,
      i.telefono,
      i.correo
    FROM instructores i
    WHERE i.estado = 'Activo'
    ORDER BY i.iddeporte ASC, i.nombre ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener instructores: " . $conn->error,
    ]);
    return;
  }

  $instructores = [];
  while ($row = $res->fetch_assoc()) {
    $instructores[] = [
      "idinstructor" => (int)$row["idinstructor"],
      "iddeporte"    => (int)$row["iddeporte"],
      "nombre"       => $row["nombre"],
      "appaterno"    => $row["appaterno"],
      "apmaterno"    => $row["apmaterno"],
      "telefono"     => $row["telefono"],
      "correo"       => $row["correo"],
    ];
  }

  echo json_encode([
    "success"      => true,
    "instructores" => $instructores,
  ]);
}
?>