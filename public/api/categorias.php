<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        listCategorias($conn);
        break;
    case 'create':
        createCategoria($conn);
        break;
    case 'update':
        updateCategoria($conn);
        break;
    case 'get':
        getCategoria($conn);
        break;
    default:
        echo json_encode([
            "success" => false,
            "error"   => "Acción no válida"
        ]);
        break;
}

$conn->close();

/* ==================== LISTAR ==================== */

function listCategorias($conn) {
    $page   = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    if ($page < 1)  $page  = 1;
    if ($limit < 1) $limit = 20;

    $offset = ($page - 1) * $limit;

    $where = '';
    if ($search !== '') {
        $searchEsc = $conn->real_escape_string($search);
        $where = "
            WHERE
                c.nombre LIKE '%$searchEsc%'
                OR p.nombre LIKE '%$searchEsc%'
        ";
    }

    // Total
    $sqlTotal = "
        SELECT COUNT(*) AS total
        FROM categorias c
        LEFT JOIN categorias p ON c.id_padre = p.idcategoria
        $where
    ";
    $resultTotal = $conn->query($sqlTotal);
    $total = 0;
    if ($resultTotal && $rowTotal = $resultTotal->fetch_assoc()) {
        $total = (int)$rowTotal["total"];
    }

    // Datos
    $sql = "
        SELECT
            c.idcategoria,
            c.nombre,
            c.id_padre,
            p.nombre AS nombre_padre
        FROM categorias c
        LEFT JOIN categorias p ON c.id_padre = p.idcategoria
        $where
        ORDER BY
            IFNULL(c.id_padre, 0),
            c.nombre
        LIMIT $limit OFFSET $offset
    ";

    $result = $conn->query($sql);
    if (!$result) {
        echo json_encode([
            "success" => false,
            "error"   => "Error al obtener categorías: " . $conn->error
        ]);
        return;
    }

    $categorias = [];
    while ($row = $result->fetch_assoc()) {
        $categorias[] = [
            "idcategoria"  => (int)$row["idcategoria"],
            "nombre"       => $row["nombre"],
            "id_padre"     => $row["id_padre"] !== null ? (int)$row["id_padre"] : null,
            "nombre_padre" => $row["nombre_padre"],
        ];
    }

    echo json_encode([
        "success"    => true,
        "categorias" => $categorias,
        "total"      => $total,
    ]);
}

/* ==================== CREAR ==================== */

function createCategoria($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    $nombre   = isset($data["nombre"]) ? trim($data["nombre"]) : '';
    $id_padre = isset($data["id_padre"]) ? $data["id_padre"] : null;

    if ($nombre === '') {
        echo json_encode([
            "success" => false,
            "error"   => "El nombre de la categoría es obligatorio."
        ]);
        return;
    }

    if ($id_padre !== null && $id_padre !== '' && (int)$id_padre > 0) {
        $id_padre = (int)$id_padre;
    } else {
        $id_padre = null;
    }

    if ($id_padre === null) {
        $stmt = $conn->prepare("
            INSERT INTO categorias (nombre, id_padre)
            VALUES (?, NULL)
        ");
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar inserción: " . $conn->error
            ]);
            return;
        }
        $stmt->bind_param("s", $nombre);
    } else {
        $stmt = $conn->prepare("
            INSERT INTO categorias (nombre, id_padre)
            VALUES (?, ?)
        ");
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar inserción: " . $conn->error
            ]);
            return;
        }
        $stmt->bind_param("si", $nombre, $id_padre);
    }

    $ok = $stmt->execute();
    if (!$ok) {
        $error = $stmt->error;
        $stmt->close();
        echo json_encode([
            "success" => false,
            "error"   => "Error al crear categoría: " . $error
        ]);
        return;
    }

    $id = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "success"     => true,
        "idcategoria" => $id,
        "msg"         => "Categoría creada correctamente."
    ]);
}

/* ==================== ACTUALIZAR ==================== */

function updateCategoria($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    $idcategoria = isset($data["idcategoria"]) ? (int)$data["idcategoria"] : 0;
    $nombre      = isset($data["nombre"]) ? trim($data["nombre"]) : '';
    $id_padre    = isset($data["id_padre"]) ? $data["id_padre"] : null;

    if ($idcategoria <= 0) {
        echo json_encode([
            "success" => false,
            "error"   => "ID de categoría inválido."
        ]);
        return;
    }

    if ($nombre === '') {
        echo json_encode([
            "success" => false,
            "error"   => "El nombre de la categoría es obligatorio."
        ]);
        return;
    }

    if ($id_padre !== null && $id_padre !== '' && (int)$id_padre > 0) {
        $id_padre = (int)$id_padre;
        if ($id_padre === $idcategoria) {
            echo json_encode([
                "success" => false,
                "error"   => "La categoría no puede ser padre de sí misma."
            ]);
            return;
        }
    } else {
        $id_padre = null;
    }

    if ($id_padre === null) {
        $stmt = $conn->prepare("
            UPDATE categorias
            SET nombre = ?, id_padre = NULL
            WHERE idcategoria = ?
        ");
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar actualización: " . $conn->error
            ]);
            return;
        }
        $stmt->bind_param("si", $nombre, $idcategoria);
    } else {
        $stmt = $conn->prepare("
            UPDATE categorias
            SET nombre = ?, id_padre = ?
            WHERE idcategoria = ?
        ");
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar actualización: " . $conn->error
            ]);
            return;
        }
        $stmt->bind_param("sii", $nombre, $id_padre, $idcategoria);
    }

    $ok = $stmt->execute();
    if (!$ok) {
        $error = $stmt->error;
        $stmt->close();
        echo json_encode([
            "success" => false,
            "error"   => "Error al actualizar categoría: " . $error
        ]);
        return;
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "msg"     => "Categoría actualizada correctamente."
    ]);
}

/* ==================== OBTENER UNA ==================== */

function getCategoria($conn) {
    $idcategoria = isset($_GET["idcategoria"]) ? (int)$_GET["idcategoria"] : 0;
    if ($idcategoria <= 0) {
        echo json_encode([
            "success" => false,
            "error"   => "ID de categoría inválido."
        ]);
        return;
    }

    $sql = "
        SELECT
            c.idcategoria,
            c.nombre,
            c.id_padre,
            p.nombre AS nombre_padre
        FROM categorias c
        LEFT JOIN categorias p ON c.id_padre = p.idcategoria
        WHERE c.idcategoria = $idcategoria
        LIMIT 1
    ";

    $result = $conn->query($sql);
    if ($result && $row = $result->fetch_assoc()) {
        echo json_encode([
            "success"   => true,
            "categoria" => [
                "idcategoria"  => (int)$row["idcategoria"],
                "nombre"       => $row["nombre"],
                "id_padre"     => $row["id_padre"] !== null ? (int)$row["id_padre"] : null,
                "nombre_padre" => $row["nombre_padre"],
            ],
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error"   => "Categoría no encontrada"
        ]);
    }
}
