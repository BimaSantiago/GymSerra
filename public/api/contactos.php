<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
  case 'create':
    createContacto($conn);
    break;
  case 'deportes':
    getDeportes($conn);
    break;
  case 'list':
    listContactos($conn);
    break;
  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida.']);
    break;
}

function getDeportes($conn) {
  $sql = "SELECT iddeporte, nombre, color FROM deporte WHERE nombre != 'Libre' ORDER BY nombre ASC";
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

function createContacto($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }

  $iddeporte = isset($body['iddeporte']) ? (int)$body['iddeporte'] : 0;
  $nombre_tutor = isset($body['nombre_tutor']) ? mysqli_real_escape_string($conn, trim($body['nombre_tutor'])) : '';
  $nombre_alumno = isset($body['nombre_alumno']) ? mysqli_real_escape_string($conn, trim($body['nombre_alumno'])) : '';
  $edad = isset($body['edad']) ? (int)$body['edad'] : 0;
  $telefono = isset($body['telefono']) ? mysqli_real_escape_string($conn, trim($body['telefono'])) : '';
  $mensaje = isset($body['mensaje']) ? mysqli_real_escape_string($conn, trim($body['mensaje'])) : '';

  if ($iddeporte <= 0 || $nombre_tutor === '' || $nombre_alumno === '' || $edad <= 0 || $telefono === '') {
    echo json_encode(['success' => false, 'error' => 'Todos los campos obligatorios deben completarse.']);
    return;
  }

  if ($edad < 3 || $edad > 100) {
    echo json_encode(['success' => false, 'error' => 'La edad debe estar entre 3 y 100 años.']);
    return;
  }

  // Obtener nombre del deporte
  $sqlDeporte = "SELECT nombre FROM deporte WHERE iddeporte = $iddeporte";
  $resDeporte = mysqli_query($conn, $sqlDeporte);
  $nombreDeporte = 'Desconocido';
  if ($resDeporte && mysqli_num_rows($resDeporte) > 0) {
    $rowDeporte = mysqli_fetch_assoc($resDeporte);
    $nombreDeporte = $rowDeporte['nombre'];
  }

  // Insertar en la base de datos
  $sql = "
    INSERT INTO contactos (iddeporte, nombre_tutor, nombre_alumno, edad, telefono, mensaje)
    VALUES ($iddeporte, '$nombre_tutor', '$nombre_alumno', $edad, '$telefono', '$mensaje')
  ";

  if (!mysqli_query($conn, $sql)) {
    echo json_encode([
      'success' => false,
      'error' => 'Error al registrar contacto: ' . mysqli_error($conn)
    ]);
    return;
  }

  $idcontacto = mysqli_insert_id($conn);

  echo json_encode([
    'success' => true,
    'idcontacto' => $idcontacto,
    'message' => 'Contacto registrado correctamente.'
  ]);
}

function listContactos($conn) {
    $page   = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    if ($page < 1)  $page  = 1;
    if ($limit < 1) $limit = 20;

    $offset = ($page - 1) * $limit;

    $where = '';
    if ($search !== '') {
        $searchEsc = $conn->real_escape_string($search);
        // Buscamos por tutor, alumno o teléfono
        $where = "
            WHERE
                c.nombre_tutor LIKE '%$searchEsc%'
                OR c.nombre_alumno LIKE '%$searchEsc%'
                OR c.telefono LIKE '%$searchEsc%'
                OR d.nombre LIKE '%$searchEsc%'
        ";
    }

    // Total de registros para paginación
    $sqlTotal = "
        SELECT COUNT(*) AS total
        FROM contactos c
        LEFT JOIN deporte d ON c.iddeporte = d.iddeporte
        $where
    ";
    $resultTotal = $conn->query($sqlTotal);
    $total = 0;
    if ($resultTotal && $rowTotal = $resultTotal->fetch_assoc()) {
        $total = (int)$rowTotal["total"];
    }

    // Consulta de datos con JOIN a deporte
    $sql = "
        SELECT
            c.idcontacto,
            c.nombre_tutor,
            c.nombre_alumno,
            c.edad,
            c.telefono,
            c.mensaje,
            c.iddeporte,
            d.nombre AS nombre_deporte
        FROM contactos c
        LEFT JOIN deporte d ON c.iddeporte = d.iddeporte
        $where
        ORDER BY c.idcontacto DESC
        LIMIT $limit OFFSET $offset
    ";

    $result = $conn->query($sql);
    if (!$result) {
        echo json_encode([
            "success" => false,
            "error"   => "Error al obtener contactos: " . $conn->error
        ]);
        return;
    }

    $contactos = [];
    while ($row = $result->fetch_assoc()) {
        $contactos[] = [
            "idcontacto"     => (int)$row["idcontacto"],
            "nombre_tutor"   => $row["nombre_tutor"],
            "nombre_alumno"  => $row["nombre_alumno"],
            "edad"           => (int)$row["edad"],
            "telefono"       => $row["telefono"],
            "mensaje"        => $row["mensaje"],
            "nombre_deporte" => $row["nombre_deporte"] ? $row["nombre_deporte"] : "Sin asignar"
        ];
    }

    echo json_encode([
        "success"   => true,
        "contactos" => $contactos,
        "total"     => $total,
    ]);
}