<?php
include "conexion.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
session_start();

$conn=ConcectarBd();

$action = $_GET['action'] ?? '';
$response = [];

$uploadDir = __DIR__ . "/../uploads/articulos/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

switch ($action) {

    case 'list':
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where = '';
        if (!empty($search)) {
            $where = "WHERE 
                a.nombre LIKE '%$search%' OR
                a.codigo_barras LIKE '%$search%' OR
                a.descripcion LIKE '%$search%' OR
                a.descripcion2 LIKE '%$search%' OR
                a.estado LIKE '%$search%'";
        }

        $query = "SELECT * FROM articulos a $where ORDER BY idarticulo ASC LIMIT $offset, $limit";
        $result = $conn->query($query);

        $articulos = [];
        while ($row = $result->fetch_assoc()) {
            $articulos[] = $row;
        }

        $countQuery = "SELECT COUNT(*) AS total FROM articulos a $where";
        $countResult = $conn->query($countQuery);
        $total = $countResult->fetch_assoc()['total'] ?? 0;

        echo json_encode([
            "articulos" => $articulos,
            "total" => (int)$total,
            "page" => $page,
            "limit" => $limit
        ]);
        break;

    case 'get':
        $id = intval($_GET['idarticulo'] ?? 0);
        $query = "SELECT * FROM articulos WHERE idarticulo = $id";
        $result = $conn->query($query);
        if ($row = $result->fetch_assoc()) {
            echo json_encode(["success" => true, "articulo" => $row]);
        } else {
            echo json_encode(["success" => false, "error" => "Artículo no encontrado"]);
        }
        break;

    case 'create':
        $nombre = $conn->real_escape_string($_POST['nombre'] ?? '');
        $codigo = $conn->real_escape_string($_POST['codigo_barras'] ?? '');
        $descripcion = $conn->real_escape_string($_POST['descripcion'] ?? '');
        $descripcion2 = $conn->real_escape_string($_POST['descripcion2'] ?? '');
        $estado = $conn->real_escape_string($_POST['estado'] ?? 'Activo');

        $imgPath = "";
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES['imagen']['tmp_name'];
            $fileName = time() . "_" . basename($_FILES['imagen']['name']);
            $targetPath = $uploadDir . $fileName;
            if (move_uploaded_file($tmpName, $targetPath)) {
                $imgPath = "uploads/articulos/" . $fileName;
            }
        }

        $stmt = $conn->prepare("INSERT INTO articulos (nombre, codigo_barras, descripcion, descripcion2, estado, img) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $nombre, $codigo, $descripcion, $descripcion2, $estado, $imgPath);
        $success = $stmt->execute();

        echo json_encode(["success" => $success, "img" => $imgPath]);
        break;

    case 'update':
        $id = intval($_POST['idarticulo'] ?? 0);
        $nombre = $conn->real_escape_string($_POST['nombre'] ?? '');
        $codigo = $conn->real_escape_string($_POST['codigo_barras'] ?? '');
        $descripcion = $conn->real_escape_string($_POST['descripcion'] ?? '');
        $descripcion2 = $conn->real_escape_string($_POST['descripcion2'] ?? '');
        $estado = $conn->real_escape_string($_POST['estado'] ?? 'Activo');

        $oldImage = "";
        $query = "SELECT img FROM articulos WHERE idarticulo = $id";
        $result = $conn->query($query);
        if ($result && $row = $result->fetch_assoc()) {
            $oldImage = $row['img'];
        }

        $imgPath = $oldImage; // por defecto mantenemos la anterior

        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES['imagen']['tmp_name'];
            $fileName = time() . "_" . basename($_FILES['imagen']['name']);
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($tmpName, $targetPath)) {
                $imgPath = "uploads/articulos/" . $fileName;

                // 🧨 Eliminar imagen anterior si existía
                if (!empty($oldImage)) {
                    $oldImagePath = __DIR__ . "/../" . $oldImage;
                    if (file_exists($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }
            }
        }

        $stmt = $conn->prepare("UPDATE articulos SET nombre=?, codigo_barras=?, descripcion=?, descripcion2=?, estado=?, img=? WHERE idarticulo=?");
        $stmt->bind_param("ssssssi", $nombre, $codigo, $descripcion, $descripcion2, $estado, $imgPath, $id);
        $success = $stmt->execute();

        echo json_encode(["success" => $success, "img" => $imgPath]);
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
        break;
}

$conn->close();
?>
