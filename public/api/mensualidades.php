<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
include 'conexion.php';
$conn=ConcectarBd();

$action = $_GET['action'] ?? '';

switch ($action) {

    /* =======================================================
     * LISTAR MENSUALIDADES (CON DATOS COMPLETOS)
     * ======================================================= */
    case 'list':
        $search = mysqli_real_escape_string($conn, $_GET['search'] ?? '');
        $where = $search !== '' ? "WHERE a.nombre_completo LIKE '%$search%' OR d.nombre LIKE '%$search%'" : '';

        $query = "
            SELECT 
                m.idmensualidad,
                a.idalumno,
                a.nombre_completo AS nombre_alumno,
                m.fecha_pago,
                m.idplan,
                m.total_pagado,
                m.estado,
                d.nombre AS nombre_deporte,
                p.dias_por_semana,
                p.costo,
                p.costo_promocion,
                p.costo_penalizacion,
                n.nombre_nivel
            FROM mensualidad m
            LEFT JOIN alumnos a ON a.idmensualidad = m.idmensualidad
            LEFT JOIN plan_pago p ON m.idplan = p.idplan
            LEFT JOIN nivel n ON p.idnivel = n.idnivel
            LEFT JOIN deporte d ON n.iddeporte = d.iddeporte
            $where
            ORDER BY a.nombre_completo ASC
        ";

        $res = mysqli_query($conn, $query);
        $mensualidades = [];
        while ($row = mysqli_fetch_assoc($res)) {
            $mensualidades[] = $row;
        }

        echo json_encode(["success" => true, "mensualidades" => $mensualidades]);
        break;

    /* =======================================================
     * LISTAR ALUMNOS ACTIVOS
     * ======================================================= */
    case 'list_alumnos':
        $res = mysqli_query($conn, "SELECT idalumno, nombre_completo FROM alumnos WHERE estado='Activo'");
        $alumnos = [];
        while ($r = mysqli_fetch_assoc($res)) $alumnos[] = $r;
        echo json_encode(["success" => true, "alumnos" => $alumnos]);
        break;

    /* =======================================================
     * LISTAR PLANES DE PAGO FILTRADOS (3 DEPORTES CLAVE)
     * ======================================================= */
    case 'list_planes':
        $res = mysqli_query($conn, "
            SELECT 
                p.idplan,
                d.nombre AS nombre_deporte,
                n.nombre_nivel,
                p.dias_por_semana,
                p.costo,
                p.costo_promocion,
                p.costo_penalizacion
            FROM plan_pago p
            JOIN nivel n ON p.idnivel = n.idnivel
            JOIN deporte d ON n.iddeporte = d.iddeporte
            WHERE d.nombre IN ('Gimnasia Artística', 'Parkour')
              AND (
                n.nombre_nivel LIKE '%Prenivel%' OR
                n.nombre_nivel LIKE '%Nivel%' OR
                n.nombre_nivel LIKE '%Principiante%' OR
                n.nombre_nivel LIKE '%Avanzado%'
              )
            ORDER BY d.nombre, n.nombre_nivel ASC
        ");
        $planes = [];
        while ($r = mysqli_fetch_assoc($res)) $planes[] = $r;
        echo json_encode(["success" => true, "planes" => $planes]);
        break;

    /* =======================================================
     * CREAR / ACTUALIZAR (CON CÁLCULO AUTOMÁTICO DE PRECIO)
     * ======================================================= */
    case 'create':
    case 'update':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            echo json_encode(["success" => false, "error" => "Datos inválidos"]);
            exit;
        }

        $idalumno = intval($data['idalumno']);
        $idplan = intval($data['idplan']);
        $fecha_pago = mysqli_real_escape_string($conn, $data['fecha_pago']);

        $planRes = mysqli_query($conn, "SELECT costo, costo_promocion, costo_penalizacion FROM plan_pago WHERE idplan=$idplan");
        $plan = mysqli_fetch_assoc($planRes);
        $dia = intval(date("d", strtotime($fecha_pago)));

        if ($dia <= 10) {
            $total = $plan['costo_promocion'];
        } elseif ($dia <= 20) {
            $total = $plan['costo'];
        } else {
            $total = $plan['costo_penalizacion'];
        }

        if ($action === 'create') {
            $sql = "INSERT INTO mensualidad (fecha_pago, idplan, total_pagado, estado)
                    VALUES ('$fecha_pago', '$idplan', '$total', 'Pagado')";
            if (mysqli_query($conn, $sql)) {
                $idmensualidad = mysqli_insert_id($conn);
                mysqli_query($conn, "UPDATE alumnos SET idmensualidad=$idmensualidad WHERE idalumno=$idalumno");
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => mysqli_error($conn)]);
            }
        } else {
            $idmensualidad = intval($data['idmensualidad']);
            $sql = "UPDATE mensualidad 
                    SET fecha_pago='$fecha_pago', idplan='$idplan', total_pagado='$total'
                    WHERE idmensualidad=$idmensualidad";
            if (mysqli_query($conn, $sql)) {
                mysqli_query($conn, "UPDATE alumnos SET idmensualidad=$idmensualidad WHERE idalumno=$idalumno");
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => mysqli_error($conn)]);
            }
        }
        break;

    default:
        echo json_encode(["success" => false, "error" => "Acción no válida"]);
        break;
}

mysqli_close($conn);
?>
