<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include "conexion.php";
$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        listNiveles($conn);
        break;
    case 'create':
        createNivel($conn);
        break;
    case 'update':
        updateNivel($conn);
        break;
    case 'get':
        getNivel($conn);
        break;
    default:
        echo json_encode([
            "success" => false,
            "error"   => "Acción no válida"
        ]);
        break;
}

$conn->close();
exit;

function listNiveles($conn) {
    $page  = isset($_GET['page'])  ? max(1, (int)$_GET['page'])  : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $offset = ($page - 1) * $limit;

    $searchEsc = $conn->real_escape_string($search);
    $where = "";

    if ($searchEsc !== "") {
        $where = "WHERE n.nombre_nivel LIKE '%$searchEsc%' 
                  OR d.nombre LIKE '%$searchEsc%'";
    }

    // Total de registros
    $sqlTotal = "
        SELECT COUNT(*) AS total
        FROM nivel n
        INNER JOIN deporte d ON d.iddeporte = n.iddeporte
        $where
    ";
    $resultTotal = $conn->query($sqlTotal);

    if (!$resultTotal) {
        echo json_encode([
            "success" => false,
            "error"   => "Error al contar niveles: " . $conn->error
        ]);
        return;
    }

    $rowTotal = $resultTotal->fetch_assoc();
    $total = (int)($rowTotal['total'] ?? 0);

    // Datos paginados
    $sql = "
        SELECT 
            n.idnivel,
            n.nombre_nivel,
            n.iddeporte,
            d.nombre AS deporte
        FROM nivel n
        INNER JOIN deporte d ON d.iddeporte = n.iddeporte
        $where
        ORDER BY n.idnivel ASC
        LIMIT $limit OFFSET $offset
    ";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode([
            "success" => false,
            "error"   => "Error al obtener niveles: " . $conn->error
        ]);
        return;
    }

    $niveles = [];
    while ($row = $result->fetch_assoc()) {
        $niveles[] = [
            "idnivel"      => (int)$row["idnivel"],
            "nombre_nivel" => $row["nombre_nivel"],
            "iddeporte"    => (int)$row["iddeporte"],
            "deporte"      => $row["deporte"],
        ];
    }

    echo json_encode([
        "success" => true,
        "niveles" => $niveles,
        "total"   => $total,
    ]);
}

function createNivel($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    $nombre_nivel = isset($data['nombre_nivel']) ? trim($data['nombre_nivel']) : '';
    $iddeporte    = isset($data['iddeporte']) ? (int)$data['iddeporte'] : 0;

    if ($nombre_nivel === '' || $iddeporte <= 0) {
        echo json_encode([
            "success" => false,
            "error"   => "Datos incompletos para crear nivel"
        ]);
        return;
    }

    $nombreEsc = $conn->real_escape_string($nombre_nivel);

    $sql = "
        INSERT INTO nivel (iddeporte, nombre_nivel)
        VALUES ($iddeporte, '$nombreEsc')
    ";

    if ($conn->query($sql)) {
        echo json_encode([
            "success" => true,
            "message" => "Nivel creado correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error"   => "Error al crear nivel: " . $conn->error
        ]);
    }
}

function updateNivel($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    $idnivel      = isset($data['idnivel']) ? (int)$data['idnivel'] : 0;
    $nombre_nivel = isset($data['nombre_nivel']) ? trim($data['nombre_nivel']) : '';
    $iddeporte    = isset($data['iddeporte']) ? (int)$data['iddeporte'] : 0;

    if ($idnivel <= 0 || $nombre_nivel === '' || $iddeporte <= 0) {
        echo json_encode([
            "success" => false,
            "error"   => "Datos incompletos para actualizar nivel"
        ]);
        return;
    }

    $nombreEsc = $conn->real_escape_string($nombre_nivel);

    $sql = "
        UPDATE nivel
        SET nombre_nivel = '$nombreEsc', iddeporte = $iddeporte
        WHERE idnivel = $idnivel
    ";

    if ($conn->query($sql)) {
        echo json_encode([
            "success" => true,
            "message" => "Nivel actualizado correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error"   => "Error al actualizar nivel: " . $conn->error
        ]);
    }
}

function getNivel($conn) {
    $idnivel = isset($_GET['idnivel']) ? (int)$_GET['idnivel'] : 0;
    if ($idnivel <= 0) {
        echo json_encode([
            "success" => false,
            "error"   => "ID de nivel inválido"
        ]);
        return;
    }

    $sql = "
        SELECT 
            n.idnivel,
            n.nombre_nivel,
            n.iddeporte,
            d.nombre AS deporte
        FROM nivel n
        INNER JOIN deporte d ON d.iddeporte = n.iddeporte
        WHERE n.idnivel = $idnivel
        LIMIT 1
    ";

    $result = $conn->query($sql);
    if ($row = $result->fetch_assoc()) {
        echo json_encode([
            "success" => true,
            "nivel"   => [
                "idnivel"      => (int)$row["idnivel"],
                "nombre_nivel" => $row["nombre_nivel"],
                "iddeporte"    => (int)$row["iddeporte"],
                "deporte"      => $row["deporte"],
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error"   => "Nivel no encontrado"
        ]);
    }
}
