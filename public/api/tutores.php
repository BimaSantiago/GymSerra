<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
include 'conexion.php';
$conn=ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {

    case 'list':
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where= $search ? "WHERE t.nombre_completo LIKE '%$search%' OR a.nombre_completo LIKE '%$search%'" : '';
        $query = "SELECT 
                t.idtutor,
                t.idalumno,
                t.nombre_completo ,
                t.curp,
                t.telefono,
                t.correo,
                t.estado_documentos,
                a.nombre_completo AS alumno_nombre,
                a.curp AS alumno_curp
            FROM tutores t
            INNER JOIN alumnos a ON t.idalumno = a.idalumno
            $where
            LIMIT $offset, $limit
        ";
        $result = $conn->query($query);

        $tutores = array();
        while ($row = $result->fetch_assoc()) {
            $tutores[] = $row;
        }

        $countQuery = "SELECT COUNT(*) AS total
            FROM tutores t
            INNER JOIN alumnos a ON t.idalumno = a.idalumno
            $where
        ";
        
        $countResult = $conn->query($countQuery);
        $total = $countResult->fetch_assoc()['total'] ?? 0;

        echo json_encode(['tutores' => $tutores, 'total' => $total]);
        break;

    case 'get':
        $idtutor = $_GET['idtutor'] ?? 0;
        $stmt = $conn->prepare("
            SELECT 
                t.idtutor,
                t.idalumno,
                t.nombre_completo,
                t.curp,
                t.telefono,
                t.correo,
                t.estado_documentos
            FROM tutores t
            WHERE idtutor = ?
        ");
        $stmt->bind_param("i", $idtutor);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'tutor' => $row]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Tutor no encontrado']);
        }
        break;

    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            INSERT INTO tutores (idalumno, nombre_completo, curp, telefono, correo, estado_documentos)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "isssss",
            $data['idalumno'],
            $data['nombre_completo'],
            $data['curp'],
            $data['telefono'],
            $data['correo'],
            $data['estado_documentos']
        );
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            UPDATE tutores
            SET idalumno = ?, nombre_completo = ?, curp = ?, telefono = ?, correo = ?, estado_documentos = ?
            WHERE idtutor = ?
        ");
        $stmt->bind_param(
            "isssssi",
            $data['idalumno'],
            $data['nombre_completo'],
            $data['curp'],
            $data['telefono'],
            $data['correo'],
            $data['estado_documentos'],
            $data['idtutor']
        );
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;

    default:
        echo json_encode(['error' => 'Acción no válida']);
}
?>
