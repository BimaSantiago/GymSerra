<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        listClasesPrueba($conn);
        break;
    case 'get':
        getClasePrueba($conn);
        break;
    case 'create':
        createClasePrueba($conn);
        break;
    case 'update':
        updateClasePrueba($conn);
        break;
    case 'delete':
        deleteClasePrueba($conn);
        break;
    case 'toggleEstado':
        toggleEstado($conn);
        break;
    case 'alumnos':
        getAlumnos($conn);
        break;
    case 'horarios':
        getHorarios($conn);
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida.']);
        break;
}

function listClasesPrueba($conn)
{
    $page   = isset($_GET['page'])  ? max(1, (int)$_GET['page']) : 1;
    $limit  = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
    $estado = isset($_GET['estado']) ? mysqli_real_escape_string($conn, $_GET['estado']) : '';

    $where = [];
    if ($search !== '') {
        $where[] = "(a.nombre_completo LIKE '%$search%' OR cp.fecha_clase LIKE '%$search%')";
    }
    if ($estado !== '') {
        $where[] = "cp.estado = '$estado'";
    }

    $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    $sqlCount = "SELECT COUNT(*) as total FROM clase_prueba cp $whereSql";
    $resCount = mysqli_query($conn, $sqlCount);
    $total = mysqli_fetch_assoc($resCount)['total'];

    $sql = "
        SELECT 
            cp.*,
            a.nombre_completo AS alumno_nombre,
            CONCAT(
                LPAD(h.hora_inicio DIV 100, 2, '0'), ':', 
                LPAD(h.hora_inicio MOD 100, 2, '0'), ' - ',
                LPAD(h.hora_fin DIV 100, 2, '0'), ':', 
                LPAD(h.hora_fin MOD 100, 2, '0')
            ) AS horario_horas,
            d.nombre AS deporte_nombre,
            d.color AS deporte_color,
            n.nombre_nivel AS nivel_nombre
        FROM clase_prueba cp
        LEFT JOIN alumnos a ON cp.idalumno = a.idalumno
        LEFT JOIN horarios h ON cp.idhorario = h.idhorario
        LEFT JOIN nivel n ON h.idnivel = n.idnivel
        LEFT JOIN deporte d ON h.iddeporte = d.iddeporte
        $whereSql
        ORDER BY cp.fecha_clase DESC, cp.idclase_prueba DESC
        LIMIT $limit OFFSET $offset
    ";

    $res = mysqli_query($conn, $sql);
    if (!$res) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener clases de prueba: ' . mysqli_error($conn)
        ]);
        return;
    }

    $clases = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $row['idclase_prueba'] = (int)$row['idclase_prueba'];
        $row['idalumno']       = (int)$row['idalumno'];
        $row['idhorario']      = (int)$row['idhorario'];
        
        // Construimos una descripción más amigable del horario
        $row['horario_descripcion'] = 
            $row['horario_horas'] . ' - ' . 
            ($row['nivel_nombre'] ?? 'Nivel desconocido') . ' ' . 
            ($row['deporte_nombre'] ?? '');

        $clases[] = $row;
    }
    mysqli_free_result($res);

    echo json_encode([
        'success'     => true,
        'clases_prueba' => $clases,
        'total'       => (int)$total
    ]);
}

function getClasePrueba($conn)
{
    $idclase_prueba = isset($_GET['idclase_prueba']) ? (int)$_GET['idclase_prueba'] : 0;

    if ($idclase_prueba <= 0) {
        echo json_encode(['success' => false, 'error' => 'ID de clase de prueba no válido.']);
        return;
    }

    $sql = "
        SELECT 
            cp.*,
            a.nombre_completo AS alumno_nombre,
            h.idhorario, h.hora_inicio, h.hora_fin, h.dia,
            d.nombre AS deporte_nombre,
            d.color AS deporte_color
        FROM clase_prueba cp
        LEFT JOIN alumnos a ON cp.idalumno = a.idalumno
        LEFT JOIN horarios h ON cp.idhorario = h.idhorario
        LEFT JOIN deporte d ON h.iddeporte = d.iddeporte
        WHERE cp.idclase_prueba = $idclase_prueba
        LIMIT 1
    ";

    $res = mysqli_query($conn, $sql);
    if (!$res || mysqli_num_rows($res) === 0) {
        echo json_encode(['success' => false, 'error' => 'Clase de prueba no encontrada.']);
        return;
    }

    $clase = mysqli_fetch_assoc($res);
    $clase['idclase_prueba'] = (int)$clase['idclase_prueba'];
    $clase['idalumno']       = (int)$clase['idalumno'];
    $clase['idhorario']      = (int)$clase['idhorario'];

    mysqli_free_result($res);

    echo json_encode([
        'success' => true,
        'clase_prueba' => $clase
    ]);
}

function createClasePrueba($conn)
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
        return;
    }

    $idalumno   = isset($body['idalumno'])   ? (int)$body['idalumno']   : 0;
    $idhorario  = isset($body['idhorario'])  ? (int)$body['idhorario']  : 0;
    $fecha_clase = isset($body['fecha_clase']) ? mysqli_real_escape_string($conn, $body['fecha_clase']) : '';

    if ($idalumno <= 0 || $idhorario <= 0 || $fecha_clase === '') {
        echo json_encode(['success' => false, 'error' => 'Todos los campos son obligatorios.']);
        return;
    }

    // Validar que no exista ya una clase de prueba para ese alumno (UNIQUE en la tabla)
    $sqlCheck = "SELECT idclase_prueba FROM clase_prueba WHERE idalumno = $idalumno";
    $resCheck = mysqli_query($conn, $sqlCheck);
    if (mysqli_num_rows($resCheck) > 0) {
        echo json_encode(['success' => false, 'error' => 'Este alumno ya tiene una clase de prueba registrada.']);
        return;
    }

    $sql = "
        INSERT INTO clase_prueba 
        (idalumno, idhorario, fecha_clase, estado)
        VALUES 
        ($idalumno, $idhorario, '$fecha_clase', 'Programada')
    ";

    if (!mysqli_query($conn, $sql)) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al crear clase de prueba: ' . mysqli_error($conn)
        ]);
        return;
    }

    $idclase_prueba = mysqli_insert_id($conn);

    echo json_encode([
        'success' => true,
        'idclase_prueba' => $idclase_prueba,
        'message' => 'Clase de prueba creada correctamente.'
    ]);
}

function updateClasePrueba($conn)
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
        return;
    }

    $idclase_prueba = isset($body['idclase_prueba']) ? (int)$body['idclase_prueba'] : 0;
    $idalumno       = isset($body['idalumno'])       ? (int)$body['idalumno']       : 0;
    $idhorario      = isset($body['idhorario'])      ? (int)$body['idhorario']      : 0;
    $fecha_clase    = isset($body['fecha_clase'])    ? mysqli_real_escape_string($conn, $body['fecha_clase']) : '';

    if ($idclase_prueba <= 0 || $idalumno <= 0 || $idhorario <= 0 || $fecha_clase === '') {
        echo json_encode(['success' => false, 'error' => 'Todos los campos son obligatorios.']);
        return;
    }

    $sql = "
        UPDATE clase_prueba
        SET idalumno    = $idalumno,
            idhorario   = $idhorario,
            fecha_clase = '$fecha_clase'
        WHERE idclase_prueba = $idclase_prueba
    ";

    if (!mysqli_query($conn, $sql)) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al actualizar clase de prueba: ' . mysqli_error($conn)
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Clase de prueba actualizada correctamente.'
    ]);
}

function deleteClasePrueba($conn)
{
    $idclase_prueba = isset($_GET['idclase_prueba']) ? (int)$_GET['idclase_prueba'] : 0;

    if ($idclase_prueba <= 0) {
        echo json_encode(['success' => false, 'error' => 'ID de clase de prueba no válido.']);
        return;
    }

    $sql = "DELETE FROM clase_prueba WHERE idclase_prueba = $idclase_prueba";

    if (!mysqli_query($conn, $sql)) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al eliminar clase de prueba: ' . mysqli_error($conn)
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Clase de prueba eliminada correctamente.'
    ]);
}

function toggleEstado($conn)
{
    $idclase_prueba = isset($_GET['idclase_prueba']) ? (int)$_GET['idclase_prueba'] : 0;

    if ($idclase_prueba <= 0) {
        echo json_encode(['success' => false, 'error' => 'ID de clase de prueba no válido.']);
        return;
    }

    $sqlGet = "SELECT estado FROM clase_prueba WHERE idclase_prueba = $idclase_prueba";
    $resGet = mysqli_query($conn, $sqlGet);
    if (!$resGet || mysqli_num_rows($resGet) === 0) {
        echo json_encode(['success' => false, 'error' => 'Clase de prueba no encontrada.']);
        return;
    }

    $row = mysqli_fetch_assoc($resGet);
    $nuevoEstado = $row['estado'] === 'Programada' ? 'Tomada' : 'Programada';

    $sql = "UPDATE clase_prueba SET estado = '$nuevoEstado' WHERE idclase_prueba = $idclase_prueba";

    if (!mysqli_query($conn, $sql)) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al cambiar estado: ' . mysqli_error($conn)
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'estado' => $nuevoEstado,
        'message' => 'Estado actualizado correctamente.'
    ]);
}

function getAlumnos($conn)
{
    $sql = "
        SELECT idalumno, nombre_completo, curp 
        FROM alumnos 
        WHERE estado = 'Activo'
        ORDER BY nombre_completo ASC
    ";

    $res = mysqli_query($conn, $sql);
    if (!$res) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener alumnos: ' . mysqli_error($conn)
        ]);
        return;
    }

    $alumnos = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $row['idalumno'] = (int)$row['idalumno'];
        $alumnos[] = $row;
    }

    echo json_encode([
        'success' => true,
        'alumnos' => $alumnos
    ]);
}

function getHorarios($conn)
{
    $sql = "
        SELECT 
            h.idhorario,
            h.hora_inicio,
            h.hora_fin,
            h.dia,
            d.nombre AS deporte,
            d.color AS color_deporte,
            n.nombre_nivel AS nivel
        FROM horarios h 
        LEFT JOIN deporte d ON h.iddeporte = d.iddeporte
        LEFT JOIN nivel n ON h.idnivel = n.idnivel
        WHERE h.iddeporte=1
        ORDER BY h.dia, h.hora_inicio 
    ";

    $res = mysqli_query($conn, $sql);
    if (!$res) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener horarios: ' . mysqli_error($conn)
        ]);
        return;
    }

    $horarios = [];
    $dias_semana = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
        7 => 'Domingo'
    ];

    while ($row = mysqli_fetch_assoc($res)) {
        $row['idhorario'] = (int)$row['idhorario'];

        // Formateo de horas (ej: 1430 → 14:30)
        $inicio_h = str_pad(floor($row['hora_inicio'] / 100), 2, '0', STR_PAD_LEFT);
        $inicio_m = str_pad($row['hora_inicio'] % 100, 2, '0', STR_PAD_LEFT);
        $fin_h    = str_pad(floor($row['hora_fin'] / 100), 2, '0', STR_PAD_LEFT);
        $fin_m    = str_pad($row['hora_fin'] % 100, 2, '0', STR_PAD_LEFT);

        $dia_nombre = $dias_semana[$row['dia']] ?? 'Día desconocido';

        // Descripción completa y amigable
        $descripcion = sprintf(
            "%s %s - %s:%s a %s:%s - %s",
            "",
            $row['deporte'] ?? 'Sin deporte',
            $inicio_h, $inicio_m,
            $fin_h, $fin_m,
            $row['nivel'] ?? ''
        );

        // Limpiamos posibles espacios dobles
        $descripcion = trim(preg_replace('/\s+/', ' ', $descripcion));

        $row['descripcion'] = $descripcion;
        $row['dia_nombre'] = $dia_nombre;
        $row['hora_inicio_fmt'] = "$inicio_h:$inicio_m";
        $row['hora_fin_fmt'] = "$fin_h:$fin_m";

        $horarios[] = $row;
    }

    mysqli_free_result($res);

    echo json_encode([
        'success' => true,
        'horarios' => $horarios
    ]);
}