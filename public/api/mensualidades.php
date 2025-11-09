<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
include 'conexion.php';
$conn=ConcectarBd();

$action = $_GET['action'] ?? '';

function json_ok($arr) { echo json_encode(["success" => true] + $arr); }
function json_err($msg) { echo json_encode(["success" => false, "error" => $msg]); }

switch ($action) {

  /* ================== LISTAR MENSUALIDADES ================== */
  case 'list': {
    $search = mysqli_real_escape_string($conn, $_GET['search'] ?? '');
    $where = $search !== ''
      ? "WHERE a.nombre_completo LIKE '%$search%' OR d.nombre LIKE '%$search%' OR n.nombre_nivel LIKE '%$search%'"
      : '';

    $sql = "
      SELECT 
        m.idmensualidad,
        a.idalumno,
        a.nombre_completo AS nombre_alumno,
        m.fecha_pago,
        m.idplan,
        m.total_pagado,
        m.estado,
        d.nombre AS nombre_deporte,
        n.nombre_nivel,
        p.dias_por_semana,
        p.costo,
        p.costo_promocion,
        p.costo_penalizacion
      FROM mensualidad m
      LEFT JOIN alumnos a ON a.idmensualidad = m.idmensualidad
      LEFT JOIN plan_pago p ON m.idplan = p.idplan
      LEFT JOIN nivel n ON p.idnivel = n.idnivel
      LEFT JOIN deporte d ON n.iddeporte = d.iddeporte
      $where
      ORDER BY a.nombre_completo ASC
    ";
    $res = mysqli_query($conn, $sql);
    $items = [];
    while ($row = mysqli_fetch_assoc($res)) $items[] = $row;
    json_ok(["mensualidades" => $items]);
    break;
  }

  /* ================== ALUMNOS ACTIVOS ================== */
  case 'list_alumnos': {
    $res = mysqli_query($conn, "SELECT idalumno, nombre_completo FROM alumnos WHERE estado='Activo' ORDER BY nombre_completo ASC");
    $items = [];
    while ($r = mysqli_fetch_assoc($res)) $items[] = $r;
    json_ok(["alumnos" => $items]);
    break;
  }

  /* ================== PLANES DE PAGO (Clasificación real) ================== */
  case 'list_planes': {
    $sql = "
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
      WHERE (
        (d.nombre = 'Gimnasia Artística' AND n.nombre_nivel LIKE '%Prenivel%')
        OR (d.nombre = 'Gimnasia Artística' AND n.nombre_nivel REGEXP 'Nivel [1-4]')
        OR (d.nombre = 'Parkour' AND n.nombre_nivel LIKE '%Principiante%')
        OR (d.nombre = 'Parkour' AND n.nombre_nivel LIKE '%Avanzado%')
      )
      ORDER BY d.nombre, n.nombre_nivel
    ";
    $res = mysqli_query($conn, $sql);
    $items = [];
    while ($r = mysqli_fetch_assoc($res)) $items[] = $r;
    json_ok(["planes" => $items]);
    break;
  }

  /* ================== CREAR / ACTUALIZAR ================== */
  case 'create':
  case 'update': {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) { json_err("Datos inválidos"); break; }

    $idalumno = intval($data['idalumno']);
    $idplan = intval($data['idplan']);
    $fecha_pago = mysqli_real_escape_string($conn, $data['fecha_pago']);

    // Obtener costo según día
    $planRes = mysqli_query($conn, "SELECT costo, costo_promocion, costo_penalizacion FROM plan_pago WHERE idplan=$idplan");
    $plan = mysqli_fetch_assoc($planRes);
    if (!$plan) { json_err("Plan no encontrado"); break; }

    $dia = intval(date("d", strtotime($fecha_pago)));
    $total = ($dia <= 10) ? $plan['costo_promocion'] : (($dia <= 20) ? $plan['costo'] : $plan['costo_penalizacion']);

    // Verificar duplicado: no se puede pagar el mismo mes si ya está pagado
    $y = intval(date("Y", strtotime($fecha_pago)));
    $m = intval(date("m", strtotime($fecha_pago)));
    $dupSQL = "
      SELECT m.idmensualidad
      FROM alumnos a
      LEFT JOIN mensualidad m ON a.idmensualidad = m.idmensualidad
      WHERE a.idalumno = $idalumno
        AND m.estado = 'Pagado'
        AND YEAR(m.fecha_pago) = $y
        AND MONTH(m.fecha_pago) = $m
    ";
    $dup = mysqli_fetch_assoc(mysqli_query($conn, $dupSQL));

    if ($action === 'create') {
      if ($dup) { json_err("Este alumno ya pagó la mensualidad este mes."); break; }

      $ins = "INSERT INTO mensualidad (fecha_pago, idplan, total_pagado, estado)
              VALUES ('$fecha_pago', '$idplan', '$total', 'Pagado')";
      if (mysqli_query($conn, $ins)) {
        $idmensualidad = mysqli_insert_id($conn);
        mysqli_query($conn, "UPDATE alumnos SET idmensualidad=$idmensualidad WHERE idalumno=$idalumno");
        json_ok(["msg" => "Mensualidad registrada correctamente"]);
      } else {
        json_err(mysqli_error($conn));
      }
    } else {
      $idmensualidad = intval($data['idmensualidad']);
      if ($dup && intval($dup['idmensualidad']) !== $idmensualidad) {
        json_err("El alumno ya tiene una mensualidad pagada este mes.");
        break;
      }
      $upd = "UPDATE mensualidad SET fecha_pago='$fecha_pago', idplan='$idplan', total_pagado='$total'
              WHERE idmensualidad=$idmensualidad";
      if (mysqli_query($conn, $upd)) {
        json_ok(["msg" => "Mensualidad actualizada correctamente"]);
      } else {
        json_err(mysqli_error($conn));
      }
    }
    break;
  }

  default:
    json_err("Acción no válida");
}

mysqli_close($conn);
?>
