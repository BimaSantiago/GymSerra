<?php
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
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
    // ------------------------------------------------------------------
    // LISTAR ALUMNOS (con info de tutor, última mensualidad y clase prueba)
    // ------------------------------------------------------------------
    case 'list':
        $page   = isset($_GET['page'])  ? max(1, intval($_GET['page']))  : 1;
        $limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where = '';
        if ($search !== '') {
            $where = "WHERE (a.nombre_completo LIKE '%$search%' OR a.curp LIKE '%$search%')";
        }

        // Total de registros para paginación
        $sqlTotal = "SELECT COUNT(*) AS total FROM alumnos a $where";
        $resultTotal = $conn->query($sqlTotal);
        $total = 0;
        if ($resultTotal && $rowTotal = $resultTotal->fetch_assoc()) {
            $total = (int)$rowTotal['total'];
        }

        // Traer alumnos + nombre_tutor + última fecha_pago y fecha_vencimiento + clase prueba
        $sql = "
            SELECT
              a.idalumno,
              a.idtutor,
              t.nombre_completo AS nombre_tutor,
              a.curp,
              a.nombre_completo,
              a.f_nacimiento,
              a.estado,
              a.estado_documentos,
              MAX(m.fecha_pago) AS fecha_pago,
              CASE
                WHEN MAX(m.fecha_pago) IS NULL THEN NULL
                ELSE DATE_FORMAT(DATE_ADD(MAX(m.fecha_pago), INTERVAL 1 MONTH), '%Y-%m-01')
              END AS fecha_vencimiento,

              CASE
                WHEN MAX(cp.idclase_prueba) IS NOT NULL THEN 1
                ELSE 0
              END AS tiene_clase_prueba
            FROM alumnos a
            LEFT JOIN tutores t     ON t.idtutor = a.idtutor
            LEFT JOIN mensualidad m ON m.idalumno = a.idalumno
            LEFT JOIN clase_prueba cp ON cp.idalumno = a.idalumno AND cp.estado = 'Tomada'
            $where
            GROUP BY
              a.idalumno,
              a.idtutor,
              t.nombre_completo,
              a.curp,
              a.nombre_completo,
              a.f_nacimiento,
              a.estado,
              a.estado_documentos
            ORDER BY a.nombre_completo ASC
            LIMIT $limit OFFSET $offset
        ";

        $result = $conn->query($sql);
        if (!$result) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al obtener alumnos: ' . $conn->error,
            ]);
            break;
        }

        $alumnos = [];
        while ($row = $result->fetch_assoc()) {
            $alumnos[] = [
                'idalumno'          => (int)$row['idalumno'],
                'idtutor'           => $row['idtutor'] !== null ? (int)$row['idtutor'] : null,
                'nombre_tutor'      => isset($row['nombre_tutor']) ? $row['nombre_tutor'] : null,
                'curp'              => $row['curp'],
                'nombre_completo'   => $row['nombre_completo'],
                'f_nacimiento'      => $row['f_nacimiento'],
                'estado'            => $row['estado'],
                'estado_documentos' => $row['estado_documentos'],
                'fecha_pago'        => $row['fecha_pago'],
                'fecha_vencimiento' => $row['fecha_vencimiento'],
                'tiene_clase_prueba' => isset($row['tiene_clase_prueba']) ? (int)$row['tiene_clase_prueba'] : 0,
            ];
        }

        echo json_encode([
            'success' => true,
            'alumnos' => $alumnos,
            'total'   => $total,
        ]);
        break;

    // ------------------------------------------------------------------
    // OBTENER UN ALUMNO POR ID (incluye última mensualidad y clase prueba)
    // ------------------------------------------------------------------
    case 'get':
        $idalumno = isset($_GET['idalumno']) ? intval($_GET['idalumno']) : 0;
        if ($idalumno <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de alumno inválido',
            ]);
            break;
        }

        $sql = "
            SELECT
              a.idalumno,
              a.idtutor,
              t.nombre_completo AS nombre_tutor,
              a.curp,
              a.nombre_completo,
              a.f_nacimiento,
              a.estado,
              a.estado_documentos,
              MAX(m.fecha_pago) AS fecha_pago,
              CASE
                WHEN MAX(m.fecha_pago) IS NULL THEN NULL
                ELSE DATE_FORMAT(DATE_ADD(MAX(m.fecha_pago), INTERVAL 1 MONTH), '%Y-%m-01')
              END AS fecha_vencimiento,
              CASE
                WHEN MAX(cp.idclase_prueba) IS NOT NULL THEN 1
                ELSE 0
              END AS tiene_clase_prueba
            FROM alumnos a
            LEFT JOIN tutores t     ON t.idtutor = a.idtutor
            LEFT JOIN mensualidad m ON m.idalumno = a.idalumno
            LEFT JOIN clase_prueba cp ON cp.idalumno = a.idalumno AND cp.estado = 'Tomada'
            WHERE a.idalumno = ?
            GROUP BY
              a.idalumno,
              a.idtutor,
              t.nombre_completo,
              a.curp,
              a.nombre_completo,
              a.f_nacimiento,
              a.estado,
              a.estado_documentos
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param("i", $idalumno);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'alumno'  => [
                    'idalumno'          => (int)$row['idalumno'],
                    'idtutor'           => $row['idtutor'] !== null ? (int)$row['idtutor'] : null,
                    'nombre_tutor'      => isset($row['nombre_tutor']) ? $row['nombre_tutor'] : null,
                    'curp'              => $row['curp'],
                    'nombre_completo'   => $row['nombre_completo'],
                    'f_nacimiento'      => $row['f_nacimiento'],
                    'estado'            => $row['estado'],
                    'estado_documentos' => $row['estado_documentos'],
                    'fecha_pago'        => $row['fecha_pago'],
                    'fecha_vencimiento' => $row['fecha_vencimiento'],
                    'tiene_clase_prueba' => isset($row['tiene_clase_prueba']) ? (int)$row['tiene_clase_prueba'] : 0,
                ],
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Alumno no encontrado',
            ]);
        }

        $stmt->close();
        break;

    // ------------------------------------------------------------------
    // CREAR ALUMNO (y opcionalmente registrar en tabla cliente)
    // ------------------------------------------------------------------
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $idtutorRaw        = $data['idtutor'] ?? null;
        $idtutor           = ($idtutorRaw === null || $idtutorRaw === '' || intval($idtutorRaw) <= 0)
                             ? null
                             : intval($idtutorRaw);

        $curp              = trim($data['curp'] ?? '');
        $nombre_completo   = trim($data['nombre_completo'] ?? '');
        $f_nacimiento      = trim($data['f_nacimiento'] ?? '');
        $estado            = $data['estado'] ?? 'Activo';
        $estado_documentos = $data['estado_documentos'] ?? 'Completo';
        $tipo_registro     = $data['tipo_registro'] ?? 'alumno';

        if ($curp === '' || $nombre_completo === '' || $f_nacimiento === '') {
            echo json_encode([
                'success' => false,
                'error'   => 'CURP, nombre completo y fecha de nacimiento son obligatorios',
            ]);
            break;
        }

        // Validar CURP duplicada
        $stmtDup = $conn->prepare("
            SELECT idalumno
            FROM alumnos
            WHERE curp = ?
            LIMIT 1
        ");
        if ($stmtDup) {
            $stmtDup->bind_param("s", $curp);
            $stmtDup->execute();
            $resDup = $stmtDup->get_result();
            if ($resDup && $resDup->fetch_assoc()) {
                $stmtDup->close();
                echo json_encode([
                    'success' => false,
                    'error'   => 'Ya existe un alumno registrado con esta CURP',
                ]);
                break;
            }
            $stmtDup->close();
        }

        $stmt = $conn->prepare("
            INSERT INTO alumnos (idtutor, curp, nombre_completo, f_nacimiento, estado, estado_documentos)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar inserción de alumno: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            "isssss",
            $idtutor,
            $curp,
            $nombre_completo,
            $f_nacimiento,
            $estado,
            $estado_documentos
        );

        $ok = $stmt->execute();
        if (!$ok) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al crear alumno: ' . $stmt->error,
            ]);
            $stmt->close();
            break;
        }

        $idalumno = $stmt->insert_id;
        $stmt->close();

        // Si también se quiere registrar como cliente (tabla "cliente")
        if ($tipo_registro === 'cliente_alumno') {
            $stmtCli = $conn->prepare("
                INSERT INTO cliente (curp, nombre_completo, f_nacimiento, estado)
                VALUES (?, ?, ?, ?)
            ");
            if ($stmtCli) {
                $estadoCli = 'Activo';
                $stmtCli->bind_param(
                    "ssss",
                    $curp,
                    $nombre_completo,
                    $f_nacimiento,
                    $estadoCli
                );
                $stmtCli->execute();
                $stmtCli->close();
                // Si falla, no rompemos el alta de alumno; solo no se crea el cliente.
            }
        }

        echo json_encode([
            'success' => true,
            'idalumno' => $idalumno,
        ]);
        break;

    // ------------------------------------------------------------------
    // HISTORIAL DE MENSUALIDADES DE UN ALUMNO
    // ------------------------------------------------------------------
    case 'mensualidades':
        $idalumno = isset($_GET['idalumno']) ? intval($_GET['idalumno']) : 0;
        if ($idalumno <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de alumno inválido',
            ]);
            break;
        }

        $sql = "
            SELECT
                m.idmensualidad,
                m.fecha_pago,
                CASE
                    WHEN m.fecha_pago IS NULL THEN NULL
                    ELSE DATE_FORMAT(DATE_ADD(MAX(m.fecha_pago), INTERVAL 1 MONTH), '%Y-%m-01')
                END AS fecha_vencimiento,
                m.total_pagado,
                m.estado,
                d.nombre AS deporte,
                CONCAT(d.nombre, ' - ', pp.dias_por_semana, ' días/semana') AS plan
            FROM mensualidad m
            INNER JOIN plan_pago pp ON m.idplan = pp.idplan
            INNER JOIN deporte d ON pp.iddeporte = d.iddeporte
            WHERE m.idalumno = ?
             GROUP BY m.idmensualidad
            ORDER BY m.fecha_pago DESC, m.idmensualidad DESC
           
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param("i", $idalumno);
        $stmt->execute();
        $result = $stmt->get_result();

        $mensualidades = [];
        while ($row = $result->fetch_assoc()) {
            $mensualidades[] = [
                'idmensualidad'     => (int)$row['idmensualidad'],
                'fecha_pago'        => $row['fecha_pago'],
                'fecha_vencimiento' => $row['fecha_vencimiento'],
                'total_pagado'      => (float)$row['total_pagado'],
                'estado'            => $row['estado'],
                'deporte'           => $row['deporte'],
                'plan'              => $row['plan'],
            ];
        }

        $stmt->close();

        echo json_encode([
            'success'       => true,
            'mensualidades' => $mensualidades,
        ]);
        break;


    // ------------------------------------------------------------------
    // ACTUALIZAR ALUMNO (incluyendo idtutor)
    // ------------------------------------------------------------------
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $idalumno          = isset($data['idalumno']) ? intval($data['idalumno']) : 0;
        if ($idalumno <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de alumno inválido',
            ]);
            break;
        }

        $idtutorRaw        = $data['idtutor'] ?? null;
        $idtutor           = ($idtutorRaw === null || $idtutorRaw === '' || intval($idtutorRaw) <= 0)
                             ? null
                             : intval($idtutorRaw);

        $curp              = trim($data['curp'] ?? '');
        $nombre_completo   = trim($data['nombre_completo'] ?? '');
        $f_nacimiento      = trim($data['f_nacimiento'] ?? '');
        $estado            = $data['estado'] ?? 'Activo';
        $estado_documentos = $data['estado_documentos'] ?? 'Completo';

        if ($curp === '' || $nombre_completo === '' || $f_nacimiento === '') {
            echo json_encode([
                'success' => false,
                'error'   => 'CURP, nombre completo y fecha de nacimiento son obligatorios',
            ]);
            break;
        }

        // Validar que la CURP no esté usada por otro alumno
        $stmtDup = $conn->prepare("
            SELECT idalumno
            FROM alumnos
            WHERE curp = ?
              AND idalumno <> ?
            LIMIT 1
        ");
        if ($stmtDup) {
            $stmtDup->bind_param("si", $curp, $idalumno);
            $stmtDup->execute();
            $resDup = $stmtDup->get_result();
            if ($resDup && $resDup->fetch_assoc()) {
                $stmtDup->close();
                echo json_encode([
                    'success' => false,
                    'error'   => 'La CURP indicada ya está registrada en otro alumno',
                ]);
                break;
            }
            $stmtDup->close();
        }

        $stmt = $conn->prepare("
            UPDATE alumnos
            SET idtutor = ?, curp = ?, nombre_completo = ?, f_nacimiento = ?, estado = ?, estado_documentos = ?
            WHERE idalumno = ?
        ");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar actualización de alumno: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            "isssssi",
            $idtutor,
            $curp,
            $nombre_completo,
            $f_nacimiento,
            $estado,
            $estado_documentos,
            $idalumno
        );

        $ok = $stmt->execute();
        if (!$ok) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al actualizar alumno: ' . $stmt->error,
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
