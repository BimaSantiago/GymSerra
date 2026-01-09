<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
  case 'list':
    listInstructores($conn);
    break;
  case 'get':
    getInstructor($conn);
    break;
  case 'create':
    createInstructor($conn);
    break;
  case 'update':
    updateInstructor($conn);
    break;
  case 'delete':
    deleteInstructor($conn);
    break;
  case 'toggleEstado':
    toggleEstado($conn);
    break;
  case 'deportes':
    getDeportes($conn);
    break;
  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida.']);
    break;
}

function listInstructores($conn) {
  $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
  $offset = ($page - 1) * $limit;
  $search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
  $estado = isset($_GET['estado']) ? mysqli_real_escape_string($conn, $_GET['estado']) : '';

  $where = [];
  if ($search !== '') {
    $where[] = "(i.nombre LIKE '%$search%' OR i.appaterno LIKE '%$search%' OR i.apmaterno LIKE '%$search%' OR i.correo LIKE '%$search%' OR i.telefono LIKE '%$search%')";
  }
  if ($estado !== '') {
    $where[] = "i.estado = '$estado'";
  }

  $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

  $sqlCount = "SELECT COUNT(*) as total FROM instructores i $whereSql";
  $resCount = mysqli_query($conn, $sqlCount);
  $total = mysqli_fetch_assoc($resCount)['total'];

  $sql = "
    SELECT 
      i.*,
      d.nombre as deporte,
      d.color as color_deporte
    FROM instructores i
    LEFT JOIN deporte d ON i.iddeporte = d.iddeporte
    $whereSql
    ORDER BY i.idinstructor DESC
    LIMIT $limit OFFSET $offset
  ";

  $res = mysqli_query($conn, $sql);
  if (!$res) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al obtener instructores: ' . mysqli_error($conn)
    ]);
    return;
  }

  $instructores = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $row['idinstructor'] = (int)$row['idinstructor'];
    $row['iddeporte'] = (int)$row['iddeporte'];
    $instructores[] = $row;
  }
  mysqli_free_result($res);

  echo json_encode([
    'success' => true,
    'instructores' => $instructores,
    'total' => (int)$total
  ]);
}

function getInstructor($conn) {
  $idinstructor = isset($_GET['idinstructor']) ? (int)$_GET['idinstructor'] : 0;

  if ($idinstructor <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de instructor no válido.']);
    return;
  }

  $sql = "
    SELECT 
      i.*,
      d.nombre as deporte,
      d.color as color_deporte
    FROM instructores i
    LEFT JOIN deporte d ON i.iddeporte = d.iddeporte
    WHERE i.idinstructor = $idinstructor
    LIMIT 1
  ";

  $res = mysqli_query($conn, $sql);
  if (!$res || mysqli_num_rows($res) === 0) {
    echo json_encode(['success' => false, 'error' => 'Instructor no encontrado.']);
    return;
  }

  $instructor = mysqli_fetch_assoc($res);
  $instructor['idinstructor'] = (int)$instructor['idinstructor'];
  $instructor['iddeporte'] = (int)$instructor['iddeporte'];
  mysqli_free_result($res);

  echo json_encode([
    'success' => true,
    'instructor' => $instructor
  ]);
}

function createInstructor($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }

  $nombre = isset($body['nombre']) ? mysqli_real_escape_string($conn, trim($body['nombre'])) : '';
  $appaterno = isset($body['appaterno']) ? mysqli_real_escape_string($conn, trim($body['appaterno'])) : '';
  $apmaterno = isset($body['apmaterno']) ? mysqli_real_escape_string($conn, trim($body['apmaterno'])) : '';
  $telefono = isset($body['telefono']) ? mysqli_real_escape_string($conn, trim($body['telefono'])) : '';
  $correo = isset($body['correo']) ? mysqli_real_escape_string($conn, trim($body['correo'])) : '';
  $iddeporte = isset($body['iddeporte']) ? (int)$body['iddeporte'] : 0;

  if ($nombre === '' || $appaterno === '' || $telefono === '' || $correo === '') {
    echo json_encode(['success' => false, 'error' => 'Todos los campos obligatorios deben completarse.']);
    return;
  }

  if ($iddeporte <= 0) {
    echo json_encode(['success' => false, 'error' => 'Debe seleccionar un deporte.']);
    return;
  }

  // Validar correo único
  $sqlCheck = "SELECT idinstructor FROM instructores WHERE correo = '$correo'";
  $resCheck = mysqli_query($conn, $sqlCheck);
  if (mysqli_num_rows($resCheck) > 0) {
    echo json_encode(['success' => false, 'error' => 'El correo ya está registrado.']);
    return;
  }

  $sql = "
    INSERT INTO instructores (nombre, appaterno, apmaterno, telefono, correo, iddeporte, estado, fecha_creacion)
    VALUES ('$nombre', '$appaterno', '$apmaterno', '$telefono', '$correo', $iddeporte, 'Activo', CURDATE())
  ";

  if (!mysqli_query($conn, $sql)) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al crear instructor: ' . mysqli_error($conn)
    ]);
    return;
  }

  $idinstructor = mysqli_insert_id($conn);

  echo json_encode([
    'success' => true,
    'idinstructor' => $idinstructor,
    'message' => 'Instructor creado correctamente.'
  ]);
}

function updateInstructor($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }

  $idinstructor = isset($body['idinstructor']) ? (int)$body['idinstructor'] : 0;
  $nombre = isset($body['nombre']) ? mysqli_real_escape_string($conn, trim($body['nombre'])) : '';
  $appaterno = isset($body['appaterno']) ? mysqli_real_escape_string($conn, trim($body['appaterno'])) : '';
  $apmaterno = isset($body['apmaterno']) ? mysqli_real_escape_string($conn, trim($body['apmaterno'])) : '';
  $telefono = isset($body['telefono']) ? mysqli_real_escape_string($conn, trim($body['telefono'])) : '';
  $correo = isset($body['correo']) ? mysqli_real_escape_string($conn, trim($body['correo'])) : '';
  $iddeporte = isset($body['iddeporte']) ? (int)$body['iddeporte'] : 0;

  if ($idinstructor <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de instructor no válido.']);
    return;
  }

  if ($nombre === '' || $appaterno === '' || $telefono === '' || $correo === '') {
    echo json_encode(['success' => false, 'error' => 'Todos los campos obligatorios deben completarse.']);
    return;
  }

  if ($iddeporte <= 0) {
    echo json_encode(['success' => false, 'error' => 'Debe seleccionar un deporte.']);
    return;
  }

  // Validar correo único (excepto el mismo instructor)
  $sqlCheck = "SELECT idinstructor FROM instructores WHERE correo = '$correo' AND idinstructor != $idinstructor";
  $resCheck = mysqli_query($conn, $sqlCheck);
  if (mysqli_num_rows($resCheck) > 0) {
    echo json_encode(['success' => false, 'error' => 'El correo ya está registrado por otro instructor.']);
    return;
  }

  $sql = "
    UPDATE instructores
    SET nombre = '$nombre',
        appaterno = '$appaterno',
        apmaterno = '$apmaterno',
        telefono = '$telefono',
        correo = '$correo',
        iddeporte = $iddeporte
    WHERE idinstructor = $idinstructor
  ";

  if (!mysqli_query($conn, $sql)) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al actualizar instructor: ' . mysqli_error($conn)
    ]);
    return;
  }

  echo json_encode([
    'success' => true,
    'message' => 'Instructor actualizado correctamente.'
  ]);
}

function deleteInstructor($conn) {
  $idinstructor = isset($_GET['idinstructor']) ? (int)$_GET['idinstructor'] : 0;

  if ($idinstructor <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de instructor no válido.']);
    return;
  }

  $sql = "DELETE FROM instructores WHERE idinstructor = $idinstructor";

  if (!mysqli_query($conn, $sql)) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al eliminar instructor: ' . mysqli_error($conn)
    ]);
    return;
  }

  echo json_encode([
    'success' => true,
    'message' => 'Instructor eliminado correctamente.'
  ]);
}

function toggleEstado($conn) {
  $idinstructor = isset($_GET['idinstructor']) ? (int)$_GET['idinstructor'] : 0;

  if ($idinstructor <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de instructor no válido.']);
    return;
  }

  $sqlGet = "SELECT estado FROM instructores WHERE idinstructor = $idinstructor";
  $resGet = mysqli_query($conn, $sqlGet);
  if (!$resGet || mysqli_num_rows($resGet) === 0) {
    echo json_encode(['success' => false, 'error' => 'Instructor no encontrado.']);
    return;
  }

  $row = mysqli_fetch_assoc($resGet);
  $nuevoEstado = $row['estado'] === 'Activo' ? 'Inactivo' : 'Activo';

  $sql = "UPDATE instructores SET estado = '$nuevoEstado' WHERE idinstructor = $idinstructor";

  if (!mysqli_query($conn, $sql)) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al cambiar estado: ' . mysqli_error($conn)
    ]);
    return;
  }

  echo json_encode([
    'success' => true,
    'estado' => $nuevoEstado,
    'message' => 'Estado actualizado correctamente.'
  ]);
}

function getDeportes($conn) {
  $sql = "SELECT iddeporte, nombre, color FROM deporte ORDER BY nombre ASC";
  $res = mysqli_query($conn, $sql);

  if (!$res) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al obtener deportes: ' . mysqli_error($conn)
    ]);
    return;
  }

  $deportes = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $row['iddeporte'] = (int)$row['iddeporte'];
    $deportes[] = $row;
  }
  mysqli_free_result($res);

  echo json_encode([
    'success' => true,
    'deportes' => $deportes
  ]);
}
?>