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

$action = $_GET["action"] ?? "listExtended";

switch ($action) {
  case "listExtended":
    listNoticiasExtended($conn);
    break;
  case "listDeportes":
    listDeportes($conn);
    break;
  case "listEventos":
    listEventos($conn);
    break;
  case "get":
    getNoticia($conn);
    break;
  case "create":
    createNoticia($conn);
    break;
  case "update":
    updateNoticia($conn);
    break;
  case "delete":
    deleteNoticia($conn);
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

function listNoticiasExtended(mysqli $conn): void {
  $page   = isset($_GET["page"]) ? max(1, (int)$_GET["page"]) : 1;
  $limit  = isset($_GET["limit"]) ? max(1, (int)$_GET["limit"]) : 6;
  $search = isset($_GET["search"]) ? trim($_GET["search"]) : "";

  $offset = ($page - 1) * $limit;

  $where = "";
  if ($search !== "") {
    $searchEsc = $conn->real_escape_string($search);
    $where = "WHERE n.titulo LIKE '%$searchEsc%'
              OR n.descripcion LIKE '%$searchEsc%'
              OR d.nombre LIKE '%$searchEsc%'";
  }

  // total
  $sqlTotal = "
    SELECT COUNT(*) AS total
    FROM noticias n
    INNER JOIN deporte d ON d.iddeporte = n.iddeporte
    INNER JOIN eventos e ON e.idevento = n.idevento
    $where
  ";
  $resTotal = $conn->query($sqlTotal);
  if (!$resTotal) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al contar noticias: " . $conn->error,
    ]);
    return;
  }
  $rowTotal = $resTotal->fetch_assoc();
  $total = (int)($rowTotal["total"] ?? 0);

  // datos
  $sql = "
    SELECT
      n.idnoticias,
      n.titulo,
      n.fecha_publicacion,
      n.iddeporte,
      n.idevento,
      n.descripcion,
      n.imagen,
      d.nombre AS deporte,
      e.descripcion AS ubicacion,
      e.fecha_inicio,
      e.fecha_fin
    FROM noticias n
    INNER JOIN deporte d ON d.iddeporte = n.iddeporte
    INNER JOIN eventos e ON e.idevento = n.idevento
    $where
    ORDER BY n.fecha_publicacion DESC, n.idnoticias DESC
    LIMIT $limit OFFSET $offset
  ";
  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener noticias: " . $conn->error,
    ]);
    return;
  }

  $noticias = [];
  while ($row = $res->fetch_assoc()) {
    $noticias[] = [
      "idnoticias"       => (int)$row["idnoticias"],
      "titulo"           => $row["titulo"],
      "fecha_publicacion"=> $row["fecha_publicacion"],
      "iddeporte"        => (int)$row["iddeporte"],
      "idevento"         => (int)$row["idevento"],
      "descripcion"      => $row["descripcion"],
      "imagen"           => $row["imagen"],
      "deporte"          => $row["deporte"],
      "ubicacion"        => $row["ubicacion"],
      "fecha_inicio"     => $row["fecha_inicio"],
      "fecha_fin"        => $row["fecha_fin"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "noticias" => $noticias,
    "total"    => $total,
  ]);
}

/**
 * Lista de deportes simples (para el select)
 */
function listDeportes(mysqli $conn): void {
  $sql = "SELECT iddeporte, nombre FROM deporte ORDER BY nombre ASC";
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
      "iddeporte" => (int)$row["iddeporte"],
      "nombre"    => $row["nombre"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "deportes" => $deportes,
  ]);
}

/**
 * Lista de eventos (para el selector del modal)
 * ubicacion = descripcion de la tabla eventos
 */
function listEventos(mysqli $conn): void {
  $sql = "
    SELECT
      idevento,
      descripcion AS ubicacion,
      fecha_inicio,
      fecha_fin
    FROM eventos
    ORDER BY fecha_inicio DESC, idevento DESC
  ";
  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener eventos: " . $conn->error,
    ]);
    return;
  }

  $eventos = [];
  while ($row = $res->fetch_assoc()) {
    $eventos[] = [
      "idevento"     => (int)$row["idevento"],
      "ubicacion"    => $row["ubicacion"],
      "fecha_inicio" => $row["fecha_inicio"],
      "fecha_fin"    => $row["fecha_fin"],
    ];
  }

  echo json_encode([
    "success" => true,
    "eventos" => $eventos,
  ]);
}

/**
 * Obtener noticia por ID (para editar)
 */
function getNoticia(mysqli $conn): void {
  $id = isset($_GET["idnoticias"]) ? (int)$_GET["idnoticias"] : 0;
  if ($id <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "ID inválido",
    ]);
    return;
  }

  $sql = "
    SELECT
      idnoticias,
      titulo,
      fecha_publicacion,
      iddeporte,
      idevento,
      descripcion,
      imagen
    FROM noticias
    WHERE idnoticias = $id
    LIMIT 1
  ";
  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener noticia: " . $conn->error,
    ]);
    return;
  }

  if ($row = $res->fetch_assoc()) {
    echo json_encode([
      "success" => true,
      "noticia" => [
        "idnoticias" => (int)$row["idnoticias"],
        "titulo"     => $row["titulo"],
        "descripcion"=> $row["descripcion"],
        "iddeporte"  => (int)$row["iddeporte"],
        "idevento"   => (int)$row["idevento"],
        "imagen"     => $row["imagen"],
      ],
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Noticia no encontrada",
    ]);
  }
}

/**
 * Manejo de subida de imagen
 */
function handleImageUpload(?array $file, ?string $currentPath = null): array {
  if (!$file || !isset($file["error"]) || $file["error"] !== UPLOAD_ERR_OK) {
    // si no hay archivo nuevo, regresamos la ruta actual (para update)
    return [true, $currentPath];
  }

  $uploadDir = __DIR__ . "/../uploads/noticias/";
  if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
  }

  $filename = uniqid("noticia_", true) . "_" . basename($file["name"]);
  $targetPath = $uploadDir . $filename;

  if (!move_uploaded_file($file["tmp_name"], $targetPath)) {
    return [false, "Error al mover el archivo subido"];
  }

  // ruta relativa que consumirá el front: http://localhost/GymSerra/public/ + imagen
  $relativePath = "uploads/noticias/" . $filename;

  return [true, $relativePath];
}

/**
 * Crear noticia
 * Espera:
 *  - titulo
 *  - descripcion
 *  - iddeporte
 *  - idevento
 *  - imagen (file)
 */
function createNoticia(mysqli $conn): void {
  $titulo      = trim($_POST["titulo"] ?? "");
  $descripcion = trim($_POST["descripcion"] ?? "");
  $iddeporte   = isset($_POST["iddeporte"]) ? (int)$_POST["iddeporte"] : 0;
  $idevento    = isset($_POST["idevento"]) ? (int)$_POST["idevento"] : 0;

  if ($titulo === "" || $descripcion === "" || $iddeporte <= 0 || $idevento <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Todos los campos son obligatorios",
    ]);
    return;
  }

  [$ok, $imageOrError] = handleImageUpload($_FILES["imagen"] ?? null, null);
  if (!$ok) {
    echo json_encode([
      "success" => false,
      "error"   => $imageOrError,
    ]);
    return;
  }

  $tituloEsc      = $conn->real_escape_string($titulo);
  $descripcionEsc = $conn->real_escape_string($descripcion);
  $imagenEsc      = $conn->real_escape_string($imageOrError);

  $sql = "
    INSERT INTO noticias (titulo, iddeporte, idevento, descripcion, imagen)
    VALUES ('$tituloEsc', $iddeporte, $idevento, '$descripcionEsc', '$imagenEsc')
  ";
  if ($conn->query($sql)) {
    echo json_encode([
      "success" => true,
      "message" => "Noticia creada correctamente",
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al crear noticia: " . $conn->error,
    ]);
  }
}

/**
 * Actualizar noticia
 */
function updateNoticia(mysqli $conn): void {
  $id          = isset($_POST["idnoticias"]) ? (int)$_POST["idnoticias"] : 0;
  $titulo      = trim($_POST["titulo"] ?? "");
  $descripcion = trim($_POST["descripcion"] ?? "");
  $iddeporte   = isset($_POST["iddeporte"]) ? (int)$_POST["iddeporte"] : 0;
  $idevento    = isset($_POST["idevento"]) ? (int)$_POST["idevento"] : 0;

  if ($id <= 0 || $titulo === "" || $descripcion === "" || $iddeporte <= 0 || $idevento <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "Datos incompletos para actualizar la noticia",
    ]);
    return;
  }

  // obtener imagen actual
  $currentImg = null;
  $res = $conn->query("SELECT imagen FROM noticias WHERE idnoticias = $id LIMIT 1");
  if ($res && $row = $res->fetch_assoc()) {
    $currentImg = $row["imagen"];
  }

  [$ok, $imageOrError] = handleImageUpload($_FILES["imagen"] ?? null, $currentImg);
  if (!$ok) {
    echo json_encode([
      "success" => false,
      "error"   => $imageOrError,
    ]);
    return;
  }

  $tituloEsc      = $conn->real_escape_string($titulo);
  $descripcionEsc = $conn->real_escape_string($descripcion);
  $imagenEsc      = $conn->real_escape_string($imageOrError);

  $sql = "
    UPDATE noticias
    SET titulo = '$tituloEsc',
        descripcion = '$descripcionEsc',
        iddeporte = $iddeporte,
        idevento = $idevento,
        imagen = '$imagenEsc'
    WHERE idnoticias = $id
  ";

  if ($conn->query($sql)) {
    echo json_encode([
      "success" => true,
      "message" => "Noticia actualizada correctamente",
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al actualizar noticia: " . $conn->error,
    ]);
  }
}

/**
 * Eliminar noticia
 */
function deleteNoticia(mysqli $conn): void {
  $id = isset($_GET["idnoticias"]) ? (int)$_GET["idnoticias"] : 0;
  if ($id <= 0) {
    echo json_encode([
      "success" => false,
      "error"   => "ID inválido",
    ]);
    return;
  }

  $sql = "DELETE FROM noticias WHERE idnoticias = $id";
  if ($conn->query($sql)) {
    echo json_encode([
      "success" => true,
      "message" => "Noticia eliminada correctamente",
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "error"   => "Error al eliminar noticia: " . $conn->error,
    ]);
  }
}