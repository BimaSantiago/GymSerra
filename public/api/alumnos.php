<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
include 'conexion.php';

$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where = $search ? "WHERE nombre_completo LIKE '%$search%'" : '';
        $query = "SELECT a.idalumno, a.curp, a.nombre_completo, a.f_nacimiento, a.estado, a.estado_documentos, m.fecha_pago 
                  FROM alumnos a 
                  INNER JOIN mensualidad m ON a.idmensualidad = m.idmensualidad 
                  $where 
                  LIMIT $offset, $limit";
        $result = $conn->query($query);

        $alumnos = array();
        while ($row = $result->fetch_assoc()) {
            $alumnos[] = $row;
        }

        $countQuery = "SELECT COUNT(*) as total FROM alumnos a $where";
        $countResult = $conn->query($countQuery);
        $total = $countResult->fetch_assoc()['total'];

        echo json_encode([
            'alumnos' => $alumnos,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit
        ]);
        break;

    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $curp = $conn->real_escape_string($data['curp']);
        $nombre_completo = $conn->real_escape_string($data['nombre_completo']);
        $f_nacimiento = $conn->real_escape_string($data['f_nacimiento']);
        $idmensualidad = (int)$data['idmensualidad'];
        $estado = $conn->real_escape_string($data['estado']);
        $estado_documentos = $conn->real_escape_string($data['estado_documentos']);

        $query = "INSERT INTO alumnos (curp, nombre_completo, f_nacimiento, estado, estado_documentos) 
                  VALUES ('$curp', '$nombre_completo', '$f_nacimiento', '$estado', '$estado_documentos')";
        if ($conn->query($query)) {
            echo json_encode(['success' => true, 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $idalumno = (int)$data['idalumno'];
        $curp = $conn->real_escape_string($data['curp']);
        $nombre_completo = $conn->real_escape_string($data['nombre_completo']);
        $f_nacimiento = $conn->real_escape_string($data['f_nacimiento']);
        $idmensualidad = (int)$data['idmensualidad'];
        $estado = $conn->real_escape_string($data['estado']);
        $estado_documentos = $conn->real_escape_string($data['estado_documentos']);

        $query = "UPDATE alumnos 
                  SET curp='$curp', nombre_completo='$nombre_completo', f_nacimiento='$f_nacimiento',
                   estado='$estado', estado_documentos='$estado_documentos' 
                  WHERE idalumno=$idalumno";
        if ($conn->query($query)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        break;

    case 'get':
        $idalumno = (int)$_GET['idalumno'];
        $query = "SELECT a.idalumno, a.curp, a.nombre_completo, a.f_nacimiento, a.estado, a.estado_documentos, m.fecha_pago, m.fecha_vencimiento 
                  FROM alumnos a 
                  JOIN mensualidad m ON a.idmensualidad = m.idmensualidad 
                  WHERE a.idalumno=$idalumno";
        $result = $conn->query($query);
        if ($row = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'alumno' => $row]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Alumno no encontrado']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
}

$conn->close();
?>