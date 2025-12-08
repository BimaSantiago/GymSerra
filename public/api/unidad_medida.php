<?php
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include 'conexion.php';
$conn = ConcectarBd();

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Error de conexión a la base de datos: ' . $conn->connect_error,
    ]);
    exit;
}

function json_response($data) {
    echo json_encode($data);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {

    /* ==================== LISTAR UNIDADES DE MEDIDA ==================== */
    case 'list':
        $page   = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        if ($page < 1)  $page  = 1;
        if ($limit < 1) $limit = 10;
        $offset = ($page - 1) * $limit;

        $where = '';
        if ($search !== '') {
            $searchEsc = $conn->real_escape_string($search);
            $where = "
                WHERE 
                    clave LIKE '%$searchEsc%' OR
                    descripcion LIKE '%$searchEsc%' OR
                    tipo LIKE '%$searchEsc%'
            ";
        }

        // Total para la paginación
        $sqlTotal = "SELECT COUNT(*) AS total FROM unidad_medida $where";
        $resultTotal = $conn->query($sqlTotal);
        $total = 0;
        if ($resultTotal && $rowTotal = $resultTotal->fetch_assoc()) {
            $total = (int)$rowTotal['total'];
        }

        // Datos paginados
        $sql = "
            SELECT
                idunidad,
                clave,
                descripcion,
                tipo
            FROM unidad_medida
            $where
            ORDER BY idunidad ASC
            LIMIT $limit OFFSET $offset
        ";

        $result = $conn->query($sql);
        if (!$result) {
            json_response([
                'success' => false,
                'error'   => 'Error al obtener unidades de medida: ' . $conn->error,
            ]);
        }

        $unidades = [];
        while ($row = $result->fetch_assoc()) {
            $unidades[] = [
                'idunidad'    => (int)$row['idunidad'],
                'clave'       => $row['clave'],
                'descripcion' => $row['descripcion'],
                'tipo'        => $row['tipo'],
            ];
        }

        json_response([
            'success'  => true,
            'unidades' => $unidades,
            'total'    => $total,
            'page'     => $page,
            'limit'    => $limit,
        ]);
        break;

    /* ==================== CREAR UNIDAD DE MEDIDA ==================== */
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $clave       = isset($data['clave']) ? strtoupper(trim($data['clave'])) : '';
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
        $tipo        = isset($data['tipo']) ? trim($data['tipo']) : null;

        if ($clave === '' || $descripcion === '') {
            json_response([
                'success' => false,
                'error'   => 'La clave y la descripción son obligatorias.',
            ]);
        }

        // Validar clave duplicada
        $stmtDup = $conn->prepare("SELECT idunidad FROM unidad_medida WHERE clave = ? LIMIT 1");
        if ($stmtDup) {
            $stmtDup->bind_param("s", $clave);
            $stmtDup->execute();
            $resDup = $stmtDup->get_result();
            if ($resDup && $resDup->fetch_assoc()) {
                $stmtDup->close();
                json_response([
                    'success' => false,
                    'error'   => 'Ya existe una unidad de medida con esa clave.',
                ]);
            }
            $stmtDup->close();
        }

        $stmt = $conn->prepare("
            INSERT INTO unidad_medida (clave, descripcion, tipo)
            VALUES (?, ?, ?)
        ");
        if (!$stmt) {
            json_response([
                'success' => false,
                'error'   => 'Error al preparar inserción: ' . $conn->error,
            ]);
        }

        $stmt->bind_param("sss", $clave, $descripcion, $tipo);
        $ok = $stmt->execute();

        if (!$ok) {
            $error = $stmt->error;
            $stmt->close();
            json_response([
                'success' => false,
                'error'   => 'Error al crear unidad de medida: ' . $error,
            ]);
        }

        $id = $stmt->insert_id;
        $stmt->close();

        json_response([
            'success'  => true,
            'idunidad' => $id,
            'msg'      => 'Unidad de medida creada correctamente.',
        ]);
        break;

    /* ==================== ACTUALIZAR UNIDAD DE MEDIDA ==================== */
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $idunidad    = isset($data['idunidad']) ? (int)$data['idunidad'] : 0;
        $clave       = isset($data['clave']) ? strtoupper(trim($data['clave'])) : '';
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
        $tipo        = isset($data['tipo']) ? trim($data['tipo']) : null;

        if ($idunidad <= 0) {
            json_response([
                'success' => false,
                'error'   => 'ID de unidad de medida inválido.',
            ]);
        }

        if ($clave === '' || $descripcion === '') {
            json_response([
                'success' => false,
                'error'   => 'La clave y la descripción son obligatorias.',
            ]);
        }

        // Validar que la clave no esté usada por otra unidad
        $stmtDup = $conn->prepare("
            SELECT idunidad
            FROM unidad_medida
            WHERE clave = ?
              AND idunidad <> ?
            LIMIT 1
        ");
        if ($stmtDup) {
            $stmtDup->bind_param("si", $clave, $idunidad);
            $stmtDup->execute();
            $resDup = $stmtDup->get_result();
            if ($resDup && $resDup->fetch_assoc()) {
                $stmtDup->close();
                json_response([
                    'success' => false,
                    'error'   => 'La clave indicada ya está registrada en otra unidad de medida.',
                ]);
            }
            $stmtDup->close();
        }

        $stmt = $conn->prepare("
            UPDATE unidad_medida
            SET clave = ?, descripcion = ?, tipo = ?
            WHERE idunidad = ?
        ");
        if (!$stmt) {
            json_response([
                'success' => false,
                'error'   => 'Error al preparar actualización: ' . $conn->error,
            ]);
        }

        $stmt->bind_param("sssi", $clave, $descripcion, $tipo, $idunidad);
        $ok = $stmt->execute();

        if (!$ok) {
            $error = $stmt->error;
            $stmt->close();
            json_response([
                'success' => false,
                'error'   => 'Error al actualizar unidad de medida: ' . $error,
            ]);
        }

        $stmt->close();
        json_response([
            'success' => true,
            'msg'     => 'Unidad de medida actualizada correctamente.',
        ]);
        break;

    default:
        json_response([
            'success' => false,
            'error'   => 'Acción no válida.',
        ]);
}

$conn->close();
