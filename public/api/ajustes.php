<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
include 'conexion.php';
$conn=ConcectarBd();

$action = $_GET['action'] ?? '';
$tipo = $_GET['tipo'] ?? ''; // "entrada" o "salida"


function tableNames($tipo) {
    if ($tipo === 'entrada') {
        return [
            "ajuste" => "ajuste_entrada",
            "detalle" => "detalle_entrada",
            "idajuste" => "identrada",
            "iddetalle" => "iddetalle_e"
        ];
    } else {
        return [
            "ajuste" => "ajuste_salida",
            "detalle" => "detalle_salida",
            "idajuste" => "idsalida",
            "iddetalle" => "iddetalle_s"
        ];
    }
}

$tables = tableNames($tipo);

if ($action === 'list') {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;
    $dateStart = isset($_GET['dateStart']) ? trim($_GET['dateStart']) : '';
    $dateEnd = isset($_GET['dateEnd']) ? trim($_GET['dateEnd']) : '';

    // Base query combinando ambas tablas
    $sqlBase = "
        SELECT identrada AS idajuste, fecha, comentario, 'entrada' AS tipo
        FROM ajuste_entrada
        UNION ALL
        SELECT idsalida AS idajuste, fecha, comentario, 'salida' AS tipo
        FROM ajuste_salida
    ";

    // Si se especifican fechas, filtramos
    if ($dateStart !== '' && $dateEnd !== '') {
        $dateStartEscaped = $conn->real_escape_string($dateStart);
        $dateEndEscaped = $conn->real_escape_string($dateEnd);
        $sqlBase = "
            SELECT * FROM (
                $sqlBase
            ) AS todos
            WHERE DATE(fecha) BETWEEN '$dateStartEscaped' AND '$dateEndEscaped'
        ";
    } elseif ($dateStart !== '') {
        $dateStartEscaped = $conn->real_escape_string($dateStart);
        $sqlBase = "
            SELECT * FROM (
                $sqlBase
            ) AS todos
            WHERE DATE(fecha) >= '$dateStartEscaped'
        ";
    } elseif ($dateEnd !== '') {
        $dateEndEscaped = $conn->real_escape_string($dateEnd);
        $sqlBase = "
            SELECT * FROM (
                $sqlBase
            ) AS todos
            WHERE DATE(fecha) <= '$dateEndEscaped'
        ";
    }

    // Calcular total
    $sqlCount = "SELECT COUNT(*) AS total FROM ($sqlBase) AS count_query";
    $countResult = $conn->query($sqlCount);
    $total = 0;
    if ($countResult && $row = $countResult->fetch_assoc()) {
        $total = intval($row['total']);
    }

    // Obtener resultados con paginación
    $sqlData = "
        SELECT * FROM (
            $sqlBase
        ) AS listado
        ORDER BY fecha DESC, idajuste DESC
        LIMIT $limit OFFSET $offset
    ";

    $result = $conn->query($sqlData);
    $ajustes = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $ajustes[] = [
                "idajuste" => intval($row['idajuste']),
                "fecha" => $row['fecha'],
                "comentario" => $row['comentario'],
                "tipo" => $row['tipo']
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "ajustes" => $ajustes,
        "total" => $total,
        "page" => $page,
        "limit" => $limit,
        "dateStart" => $dateStart,
        "dateEnd" => $dateEnd
    ]);
    exit;
}

if ($action === 'create') {
    $input = json_decode(file_get_contents('php://input'), true);
    $comentario = trim($input['comentario'] ?? '');

    if ($comentario === '') {
        echo json_encode(["success" => false, "error" => "El comentario es obligatorio"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO {$tables['ajuste']} (comentario) VALUES (?)");
    $stmt->bind_param("s", $comentario);
    $success = $stmt->execute();
    $idajuste = $stmt->insert_id;

    echo json_encode(["success" => $success, "idajuste" => $idajuste]);
    exit;
}

if ($action === 'addDetalle') {
    $input = json_decode(file_get_contents('php://input'), true);
    $idajuste = $input['idajuste'] ?? 0;
    $idarticulo = $input['idarticulo'] ?? 0;
    $conteo = $input['conteo'] ?? 0;
    $diferencia = $input['diferencia'] ?? 0;

    if (!$idajuste || !$idarticulo) {
        echo json_encode(["success" => false, "error" => "Datos incompletos"]);
        exit;
    }

    // Insertar detalle
    $stmt = $conn->prepare("
        INSERT INTO {$tables['detalle']} ({$tables['idajuste']}, idarticulo, conteo, diferencia)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param("iiii", $idajuste, $idarticulo, $conteo, $diferencia);
    $success = $stmt->execute();

    if ($success) {
        // Ajustar stock
        if ($tipo === 'entrada') {
            $update = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
            $update->bind_param("ii", $diferencia, $idarticulo);
        } else {
            $update = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
            $update->bind_param("ii", $diferencia, $idarticulo);
        }
        $update->execute();
    }

    echo json_encode(["success" => $success]);
    exit;
}

if ($action === 'detalle') {
    $idajuste = $_GET['idajuste'] ?? 0;

    $q1 = $conn->prepare("SELECT * FROM {$tables['ajuste']} WHERE {$tables['idajuste']} = ?");
    $q1->bind_param("i", $idajuste);
    $q1->execute();
    $info = $q1->get_result()->fetch_assoc();

    $q2 = $conn->prepare("
        SELECT d.{$tables['iddetalle']} AS iddetalle, a.nombre AS articulo, d.idarticulo, d.conteo, d.diferencia
        FROM {$tables['detalle']} d
        JOIN articulos a ON a.idarticulo = d.idarticulo
        WHERE d.{$tables['idajuste']} = ?
    ");
    $q2->bind_param("i", $idajuste);
    $q2->execute();
    $result = $q2->get_result();

    $detalles = [];
    while ($row = $result->fetch_assoc()) {
        $detalles[] = $row;
    }

    echo json_encode(["success" => true, "info" => $info, "detalles" => $detalles]);
    exit;
}

if ($action === 'deleteDetalle') {
    $iddetalle = $_GET['iddetalle'] ?? 0;

    // Buscar detalle
    $q = $conn->prepare("
        SELECT idarticulo, diferencia
        FROM {$tables['detalle']}
        WHERE {$tables['iddetalle']} = ?
    ");
    $q->bind_param("i", $iddetalle);
    $q->execute();
    $detalle = $q->get_result()->fetch_assoc();

    if (!$detalle) {
        echo json_encode(["success" => false, "error" => "Detalle no encontrado"]);
        exit;
    }

    $idarticulo = $detalle['idarticulo'];
    $diferencia = $detalle['diferencia'];

    // Eliminar detalle
    $stmt = $conn->prepare("DELETE FROM {$tables['detalle']} WHERE {$tables['iddetalle']} = ?");
    $stmt->bind_param("i", $iddetalle);
    $success = $stmt->execute();

    if ($success) {
        if ($tipo === 'entrada') {
            $update = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
            $update->bind_param("ii", $diferencia, $idarticulo);
        } else {
            $update = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
            $update->bind_param("ii", $diferencia, $idarticulo);
        }
        $update->execute();
    }

    echo json_encode(["success" => $success]);
    exit;
}

echo json_encode(["success" => false, "error" => "Acción no válida"]);
?>
