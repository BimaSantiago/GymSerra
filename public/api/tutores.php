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

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {
    case 'list':
        $page   = isset($_GET['page'])  ? max(1, intval($_GET['page']))  : 1;
        $limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where = '';
        if ($search !== '') {
            $where = "WHERE (nombre_completo LIKE '%$search%' OR curp LIKE '%$search%' OR correo LIKE '%$search%')";
        }

        // Total de registros para paginación
        $sqlTotal = "SELECT COUNT(*) AS total FROM tutores $where";
        $resultTotal = $conn->query($sqlTotal);
        $total = 0;
        if ($resultTotal && $rowTotal = $resultTotal->fetch_assoc()) {
            $total = (int)$rowTotal['total'];
        }

        $sql = "
            SELECT
              idtutor,
              nombre_completo,
              curp,
              telefono,
              correo,
              estado_documentos
            FROM tutores
            $where
            ORDER BY nombre_completo ASC
            LIMIT $limit OFFSET $offset
        ";

        $result = $conn->query($sql);
        if (!$result) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al obtener tutores: ' . $conn->error,
            ]);
            break;
        }

        $tutores = [];
        while ($row = $result->fetch_assoc()) {
            $tutores[] = [
                'idtutor'           => (int)$row['idtutor'],
                'nombre_completo'   => $row['nombre_completo'],
                'curp'              => $row['curp'],
                'telefono'          => $row['telefono'],
                'correo'            => $row['correo'],
                'estado_documentos' => $row['estado_documentos'],
            ];
        }

        echo json_encode([
            'success' => true,
            'tutores' => $tutores,
            'total'   => $total,
        ]);
        break;

    case 'get':
        $idtutor = isset($_GET['idtutor']) ? intval($_GET['idtutor']) : 0;
        if ($idtutor <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de tutor inválido',
            ]);
            break;
        }

        $stmt = $conn->prepare("
            SELECT
              idtutor,
              nombre_completo,
              curp,
              telefono,
              correo,
              estado_documentos
            FROM tutores
            WHERE idtutor = ?
            LIMIT 1
        ");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param("i", $idtutor);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'tutor'   => [
                    'idtutor'           => (int)$row['idtutor'],
                    'nombre_completo'   => $row['nombre_completo'],
                    'curp'              => $row['curp'],
                    'telefono'          => $row['telefono'],
                    'correo'            => $row['correo'],
                    'estado_documentos' => $row['estado_documentos'],
                ],
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Tutor no encontrado',
            ]);
        }

        $stmt->close();
        break;

    case 'create':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $nombre_completo   = trim($data['nombre_completo'] ?? '');
        $curp              = trim($data['curp'] ?? '');
        $telefono          = trim($data['telefono'] ?? '');
        $correo            = trim($data['correo'] ?? '');
        $estado_documentos = $data['estado_documentos'] ?? 'Incompleto';

        if ($nombre_completo === '' || $curp === '' || $telefono === '' || $correo === '') {
            echo json_encode([
                'success' => false,
                'error'   => 'Nombre completo, CURP, teléfono y correo son obligatorios',
            ]);
            break;
        }

        $stmt = $conn->prepare("
            INSERT INTO tutores (nombre_completo, curp, telefono, correo, estado_documentos)
            VALUES (?, ?, ?, ?, ?)
        ");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar inserción de tutor: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            "sssss",
            $nombre_completo,
            $curp,
            $telefono,
            $correo,
            $estado_documentos
        );

        $ok = $stmt->execute();
        if (!$ok) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al crear tutor: ' . $stmt->error,
            ]);
            $stmt->close();
            break;
        }

        $idtutor = $stmt->insert_id;
        $stmt->close();

        echo json_encode([
            'success' => true,
            'id'      => $idtutor,
        ]);
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $idtutor           = isset($data['idtutor']) ? intval($data['idtutor']) : 0;
        $nombre_completo   = trim($data['nombre_completo'] ?? '');
        $curp              = trim($data['curp'] ?? '');
        $telefono          = trim($data['telefono'] ?? '');
        $correo            = trim($data['correo'] ?? '');
        $estado_documentos = $data['estado_documentos'] ?? 'Incompleto';

        if ($idtutor <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de tutor inválido',
            ]);
            break;
        }

        if ($nombre_completo === '' || $curp === '' || $telefono === '' || $correo === '') {
            echo json_encode([
                'success' => false,
                'error'   => 'Nombre completo, CURP, teléfono y correo son obligatorios',
            ]);
            break;
        }

        $stmt = $conn->prepare("
            UPDATE tutores
            SET nombre_completo = ?, curp = ?, telefono = ?, correo = ?, estado_documentos = ?
            WHERE idtutor = ?
        ");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar actualización de tutor: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            "sssssi",
            $nombre_completo,
            $curp,
            $telefono,
            $correo,
            $estado_documentos,
            $idtutor
        );

        $ok = $stmt->execute();
        if (!$ok) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al actualizar tutor: ' . $stmt->error,
            ]);
            $stmt->close();
            break;
        }

        $stmt->close();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode([
            'success' => false,
            'error'   => 'Acción no válida',
        ]);
        break;
}

$conn->close();
