<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

include 'conexion.php';
$conn = ConcectarBd();
// Asegurar UTF-8
mysqli_set_charset($conn, "utf8");

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {
  case 'list':
    listarCortes($conn);
    break;

  case 'closeCurrent':
    cerrarCorteActual($conn);
    break;

  case 'detalle':
    detalleCorte($conn);
    break;

  default:
    echo json_encode([
      'success' => false,
      'error'   => 'Acción no válida.',
    ]);
    break;
}

/**
 * LISTAR CORTES CON PAGINACIÓN Y RANGO DE FECHAS (mysqli)
 */
function listarCortes($conn)
{
  $page   = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $limit  = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
  $offset = ($page - 1) * $limit;

  $dateStart = isset($_GET['dateStart']) ? $_GET['dateStart'] : null;
  $dateEnd   = isset($_GET['dateEnd']) ? $_GET['dateEnd'] : null;

  $where   = [];
  $params  = [];
  $types   = '';

  if (!empty($dateStart)) {
    $where[]  = "DATE(c.fecha_inicio) >= ?";
    $params[] = $dateStart;
    $types   .= 's';
  }
  if (!empty($dateEnd)) {
    $where[]  = "DATE(c.fecha_inicio) <= ?";
    $params[] = $dateEnd;
    $types   .= 's';
  }

  $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

  // Total de registros
  $sqlCount = "SELECT COUNT(*) AS total FROM corte_caja c $whereSql";
  $stmtCount = mysqli_prepare($conn, $sqlCount);
  if ($stmtCount === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de conteo: ' . mysqli_error($conn),
    ]);
    return;
  }

  if (!empty($params)) {
    mysqli_stmt_bind_param($stmtCount, $types, ...$params);
  }

  if (!mysqli_stmt_execute($stmtCount)) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de conteo: ' . mysqli_stmt_error($stmtCount),
    ]);
    mysqli_stmt_close($stmtCount);
    return;
  }

  $resultCount = mysqli_stmt_get_result($stmtCount);
  $rowCount    = mysqli_fetch_assoc($resultCount);
  $total       = (int)$rowCount['total'];
  mysqli_free_result($resultCount);
  mysqli_stmt_close($stmtCount);

  // Lista de cortes
  // Si el corte está cerrado: usa total_vendido almacenado
  // Si está abierto: calcula ventas - devoluciones - cancelaciones
  $sqlList = "SELECT
                c.idcorte,
                c.folio,
                c.fecha_inicio,
                c.fecha_corte,
                CASE
                  WHEN c.fecha_corte IS NOT NULL THEN c.total_vendido
                  ELSE (
                    COALESCE((
                      SELECT SUM(m.total)
                      FROM movimiento m
                      WHERE m.idcorte = c.idcorte
                        AND m.tipo = 'Venta'
                    ), 0)
                    - COALESCE((
                      SELECT SUM(d.monto_devuelto)
                      FROM devolucion d
                      WHERE d.idcorte = c.idcorte
                    ), 0)
                    - COALESCE((
                      SELECT SUM(m2.total)
                      FROM cancelacion ca
                      INNER JOIN movimiento m2 ON m2.idmovimiento = ca.idmovimiento
                      INNER JOIN motivos_cancelacion mc ON mc.idmotivo = ca.idmotivo
                      WHERE m2.idcorte = c.idcorte
                        AND m2.tipo = 'Venta'
                        AND mc.tipo = 'Cancelacion'
                    ), 0)
                  )
                END AS total_vendido
              FROM corte_caja c
              $whereSql
              ORDER BY c.fecha_inicio DESC
              LIMIT ? OFFSET ?";

  $stmtList = mysqli_prepare($conn, $sqlList);
  if ($stmtList === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de listado: ' . mysqli_error($conn),
    ]);
    return;
  }

  // Agregamos limit y offset al final
  $paramsList = $params;
  $typesList  = $types . 'ii';
  $paramsList[] = $limit;
  $paramsList[] = $offset;

  mysqli_stmt_bind_param($stmtList, $typesList, ...$paramsList);

  if (!mysqli_stmt_execute($stmtList)) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de listado: ' . mysqli_stmt_error($stmtList),
    ]);
    mysqli_stmt_close($stmtList);
    return;
  }

  $resultList = mysqli_stmt_get_result($stmtList);
  $cortes = [];
  while ($row = mysqli_fetch_assoc($resultList)) {
    $cortes[] = $row;
  }
  mysqli_free_result($resultList);
  mysqli_stmt_close($stmtList);

  echo json_encode([
    'success' => true,
    'cortes'  => $cortes,
    'total'   => $total,
  ]);
}


/**
 * CERRAR CORTE ACTUAL Y CREAR UNO NUEVO (mysqli)
 */
function cerrarCorteActual($conn)
{
  // Desactivar autocommit para manejar transacción
  mysqli_autocommit($conn, false);

  try {
    $hoy = date('Y-m-d');

    // Buscar corte abierto (fecha_corte IS NULL)
    $sqlCorteAbierto = "SELECT * FROM corte_caja WHERE fecha_corte IS NULL ORDER BY fecha_inicio DESC LIMIT 1";
    $resCorte = mysqli_query($conn, $sqlCorteAbierto);
    if ($resCorte === false) {
      throw new Exception('Error al buscar corte actual: ' . mysqli_error($conn));
    }

    $corteActual = mysqli_fetch_assoc($resCorte);
    mysqli_free_result($resCorte);

    $corteActualData = null;

    if ($corteActual) {
      $idcorteActual = (int)$corteActual['idcorte'];

      // Total ventas del día (tipo Venta)
      $sqlVentas = "
        SELECT IFNULL(SUM(total), 0) AS total_ventas
        FROM movimiento
        WHERE tipo = 'Venta'
          AND DATE(fecha) = ?
      ";
      $stmtVentas = mysqli_prepare($conn, $sqlVentas);
      if ($stmtVentas === false) {
        throw new Exception('Error al preparar consulta de ventas: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtVentas, 's', $hoy);
      if (!mysqli_stmt_execute($stmtVentas)) {
        $err = mysqli_stmt_error($stmtVentas);
        mysqli_stmt_close($stmtVentas);
        throw new Exception('Error al ejecutar consulta de ventas: ' . $err);
      }

      $resVentas = mysqli_stmt_get_result($stmtVentas);
      $rowVentas = mysqli_fetch_assoc($resVentas);
      $totalVentas = (float)$rowVentas['total_ventas'];
      mysqli_free_result($resVentas);
      mysqli_stmt_close($stmtVentas);

      // Total devoluciones del día
      $sqlDevo = "
        SELECT IFNULL(SUM(monto_devuelto), 0) AS total_devoluciones
        FROM devolucion
        WHERE DATE(fecha_devolucion) = ?
      ";
      $stmtDevo = mysqli_prepare($conn, $sqlDevo);
      if ($stmtDevo === false) {
        throw new Exception('Error al preparar consulta de devoluciones: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtDevo, 's', $hoy);
      if (!mysqli_stmt_execute($stmtDevo)) {
        $err = mysqli_stmt_error($stmtDevo);
        mysqli_stmt_close($stmtDevo);
        throw new Exception('Error al ejecutar consulta de devoluciones: ' . $err);
      }

      $resDevo = mysqli_stmt_get_result($stmtDevo);
      $rowDevo = mysqli_fetch_assoc($resDevo);
      $totalDevoluciones = (float)$rowDevo['total_devoluciones'];
      mysqli_free_result($resDevo);
      mysqli_stmt_close($stmtDevo);

      // Total cancelaciones del día (ventas canceladas)
      $sqlCanc = "
        SELECT IFNULL(SUM(m.total), 0) AS total_cancelaciones
        FROM cancelacion c
        INNER JOIN motivos_cancelacion mc ON c.idmotivo = mc.idmotivo
        LEFT JOIN movimiento m ON c.idmovimiento = m.idmovimiento
        WHERE mc.tipo = 'Cancelacion'
          AND m.tipo = 'Venta'
          AND DATE(m.fecha) = ?
      ";
      $stmtCanc = mysqli_prepare($conn, $sqlCanc);
      if ($stmtCanc === false) {
        throw new Exception('Error al preparar consulta de cancelaciones: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtCanc, 's', $hoy);
      if (!mysqli_stmt_execute($stmtCanc)) {
        $err = mysqli_stmt_error($stmtCanc);
        mysqli_stmt_close($stmtCanc);
        throw new Exception('Error al ejecutar consulta de cancelaciones: ' . $err);
      }

      $resCanc = mysqli_stmt_get_result($stmtCanc);
      $rowCanc = mysqli_fetch_assoc($resCanc);
      $totalCancelaciones = (float)$rowCanc['total_cancelaciones'];
      mysqli_free_result($resCanc);
      mysqli_stmt_close($stmtCanc);

      $totalCorte = $totalVentas - $totalDevoluciones - $totalCancelaciones;

      // Actualizar corte actual (cerrarlo)
      $sqlUpdateCorte = "
        UPDATE corte_caja
        SET fecha_corte = NOW(),
            total_vendido = ?
        WHERE idcorte = ?
      ";
      $stmtUpdate = mysqli_prepare($conn, $sqlUpdateCorte);
      if ($stmtUpdate === false) {
        throw new Exception('Error al preparar actualización de corte: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtUpdate, 'di', $totalCorte, $idcorteActual);
      if (!mysqli_stmt_execute($stmtUpdate)) {
        $err = mysqli_stmt_error($stmtUpdate);
        mysqli_stmt_close($stmtUpdate);
        throw new Exception('Error al ejecutar actualización de corte: ' . $err);
      }
      mysqli_stmt_close($stmtUpdate);

      // Ligar movimientos de ventas del día sin corte a este corte
      $sqlUpdateMov = "
        UPDATE movimiento
        SET idcorte = ?
        WHERE idcorte IS NULL
          AND tipo = 'Venta'
          AND DATE(fecha) = ?
      ";
      $stmtMov = mysqli_prepare($conn, $sqlUpdateMov);
      if ($stmtMov === false) {
        throw new Exception('Error al preparar actualización de movimientos: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtMov, 'is', $idcorteActual, $hoy);
      if (!mysqli_stmt_execute($stmtMov)) {
        $err = mysqli_stmt_error($stmtMov);
        mysqli_stmt_close($stmtMov);
        throw new Exception('Error al ejecutar actualización de movimientos: ' . $err);
      }
      mysqli_stmt_close($stmtMov);

      // Recargar info del corte actualizado
      $sqlCorteData = "SELECT idcorte, folio, fecha_inicio, fecha_corte, total_vendido FROM corte_caja WHERE idcorte = ?";
      $stmtCorteData = mysqli_prepare($conn, $sqlCorteData);
      if ($stmtCorteData === false) {
        throw new Exception('Error al preparar consulta de corte actualizado: ' . mysqli_error($conn));
      }

      mysqli_stmt_bind_param($stmtCorteData, 'i', $idcorteActual);
      if (!mysqli_stmt_execute($stmtCorteData)) {
        $err = mysqli_stmt_error($stmtCorteData);
        mysqli_stmt_close($stmtCorteData);
        throw new Exception('Error al ejecutar consulta de corte actualizado: ' . $err);
      }

      $resCorteData = mysqli_stmt_get_result($stmtCorteData);
      $corteActualData = mysqli_fetch_assoc($resCorteData);
      mysqli_free_result($resCorteData);
      mysqli_stmt_close($stmtCorteData);
    }

    // Crear nuevo corte abierto (sin total todavía)
    $sqlInsert = "
      INSERT INTO corte_caja (folio, fecha_inicio, fecha_corte, total_vendido)
      VALUES ('', NOW(), NULL, 0)
    ";
    if (!mysqli_query($conn, $sqlInsert)) {
      throw new Exception('Error al crear nuevo corte: ' . mysqli_error($conn));
    }

    $idNuevo = (int)mysqli_insert_id($conn);

    // Generar folio automático (CC-000001, etc.)
    $folio = 'CC-' . str_pad((string)$idNuevo, 6, '0', STR_PAD_LEFT);
    $sqlUpdateFolio = "UPDATE corte_caja SET folio = ? WHERE idcorte = ?";
    $stmtFolio = mysqli_prepare($conn, $sqlUpdateFolio);
    if ($stmtFolio === false) {
      throw new Exception('Error al preparar actualización de folio: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmtFolio, 'si', $folio, $idNuevo);
    if (!mysqli_stmt_execute($stmtFolio)) {
      $err = mysqli_stmt_error($stmtFolio);
      mysqli_stmt_close($stmtFolio);
      throw new Exception('Error al ejecutar actualización de folio: ' . $err);
    }
    mysqli_stmt_close($stmtFolio);

    // Obtener datos del nuevo corte
    $sqlNuevo = "SELECT idcorte, folio, fecha_inicio, fecha_corte, total_vendido FROM corte_caja WHERE idcorte = ?";
    $stmtNuevo = mysqli_prepare($conn, $sqlNuevo);
    if ($stmtNuevo === false) {
      throw new Exception('Error al preparar consulta del nuevo corte: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmtNuevo, 'i', $idNuevo);
    if (!mysqli_stmt_execute($stmtNuevo)) {
      $err = mysqli_stmt_error($stmtNuevo);
      mysqli_stmt_close($stmtNuevo);
      throw new Exception('Error al ejecutar consulta del nuevo corte: ' . $err);
    }

    $resNuevo = mysqli_stmt_get_result($stmtNuevo);
    $nuevoCorte = mysqli_fetch_assoc($resNuevo);
    mysqli_free_result($resNuevo);
    mysqli_stmt_close($stmtNuevo);

    // Todo OK, commit
    mysqli_commit($conn);
    mysqli_autocommit($conn, true);

    $message = $corteActualData
      ? 'Corte de caja actual cerrado correctamente. Se creó un nuevo corte.'
      : 'No había corte de caja abierto. Se creó un nuevo corte.';

    echo json_encode([
      'success'     => true,
      'message'     => $message,
      'corteActual' => $corteActualData,
      'nuevoCorte'  => $nuevoCorte,
    ]);
  } catch (Exception $e) {
    mysqli_rollback($conn);
    mysqli_autocommit($conn, true);

    echo json_encode([
      'success' => false,
      'error'   => 'Error al cerrar el corte de caja: ' . $e->getMessage(),
    ]);
  }
}

/**
 * DETALLE DE CORTE (info + ventas + devoluciones + cancelaciones) (mysqli)
 */
function detalleCorte($conn)
{
  $idcorte = isset($_GET['idcorte']) ? (int)$_GET['idcorte'] : 0;

  if ($idcorte <= 0) {
    echo json_encode([
      'success' => false,
      'error'   => 'ID de corte no válido.',
    ]);
    return;
  }

  // Info del corte
  $sqlInfo = "
    SELECT idcorte, folio, fecha_inicio, fecha_corte, total_vendido
    FROM corte_caja
    WHERE idcorte = ?
  ";
  $stmtInfo = mysqli_prepare($conn, $sqlInfo);
  if ($stmtInfo === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de información de corte: ' . mysqli_error($conn),
    ]);
    return;
  }

  mysqli_stmt_bind_param($stmtInfo, 'i', $idcorte);
  if (!mysqli_stmt_execute($stmtInfo)) {
    $err = mysqli_stmt_error($stmtInfo);
    mysqli_stmt_close($stmtInfo);
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de información de corte: ' . $err,
    ]);
    return;
  }

  $resInfo = mysqli_stmt_get_result($stmtInfo);
  $info = mysqli_fetch_assoc($resInfo);
  mysqli_free_result($resInfo);
  mysqli_stmt_close($stmtInfo);

  if (!$info) {
    echo json_encode([
      'success' => false,
      'error'   => 'Corte de caja no encontrado.',
    ]);
    return;
  }

  // Ventas ligadas al corte
  $sqlVentas = "
    SELECT idmovimiento, fecha, total, tipo, comentario, idcliente, iduser
    FROM movimiento
    WHERE idcorte = ?
      AND tipo = 'Venta'
    ORDER BY fecha ASC
  ";
  $stmtVentas = mysqli_prepare($conn, $sqlVentas);
  if ($stmtVentas === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de ventas del corte: ' . mysqli_error($conn),
    ]);
    return;
  }

  mysqli_stmt_bind_param($stmtVentas, 'i', $idcorte);
  if (!mysqli_stmt_execute($stmtVentas)) {
    $err = mysqli_stmt_error($stmtVentas);
    mysqli_stmt_close($stmtVentas);
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de ventas del corte: ' . $err,
    ]);
    return;
  }

  $resVentas = mysqli_stmt_get_result($stmtVentas);
  $ventas = [];
  while ($row = mysqli_fetch_assoc($resVentas)) {
    $ventas[] = $row;
  }
  mysqli_free_result($resVentas);
  mysqli_stmt_close($stmtVentas);

  // Devoluciones ligadas al corte
  $sqlDevo = "
    SELECT iddevolucion, idmovimiento, monto_devuelto, fecha_devolucion
    FROM devolucion
    WHERE idcorte = ?
    ORDER BY fecha_devolucion ASC
  ";
  $stmtDevo = mysqli_prepare($conn, $sqlDevo);
  if ($stmtDevo === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de devoluciones del corte: ' . mysqli_error($conn),
    ]);
    return;
  }

  mysqli_stmt_bind_param($stmtDevo, 'i', $idcorte);
  if (!mysqli_stmt_execute($stmtDevo)) {
    $err = mysqli_stmt_error($stmtDevo);
    mysqli_stmt_close($stmtDevo);
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de devoluciones del corte: ' . $err,
    ]);
    return;
  }

  $resDevo = mysqli_stmt_get_result($stmtDevo);
  $devoluciones = [];
  while ($row = mysqli_fetch_assoc($resDevo)) {
    $devoluciones[] = $row;
  }
  mysqli_free_result($resDevo);
  mysqli_stmt_close($stmtDevo);

    // Cancelaciones asociadas (por ventas de este corte)
  $sqlCanc = "
    SELECT 
      c.idcancelacion, 
      c.idmovimiento, 
      c.descripcion, 
      mc.nombre AS motivo,
      m.total AS monto_cancelado
    FROM cancelacion c
    INNER JOIN motivos_cancelacion mc ON c.idmotivo = mc.idmotivo
    INNER JOIN movimiento m ON c.idmovimiento = m.idmovimiento
    WHERE m.idcorte = ?
      AND m.tipo = 'Venta'
      AND mc.tipo = 'Cancelacion'
  ";
  $stmtCanc = mysqli_prepare($conn, $sqlCanc);
  if ($stmtCanc === false) {
    echo json_encode([
      'success' => false,
      'error'   => 'Error al preparar consulta de cancelaciones del corte: ' . mysqli_error($conn),
    ]);
    return;
  }

  mysqli_stmt_bind_param($stmtCanc, 'i', $idcorte);
  if (!mysqli_stmt_execute($stmtCanc)) {
    $err = mysqli_stmt_error($stmtCanc);
    mysqli_stmt_close($stmtCanc);
    echo json_encode([
      'success' => false,
      'error'   => 'Error al ejecutar consulta de cancelaciones del corte: ' . $err,
    ]);
    return;
  }

  $resCanc = mysqli_stmt_get_result($stmtCanc);
  $cancelaciones = [];
  while ($row = mysqli_fetch_assoc($resCanc)) {
    $cancelaciones[] = $row;
  }
  mysqli_free_result($resCanc);
  mysqli_stmt_close($stmtCanc);

  echo json_encode([
    'success'       => true,
    'info'          => $info,
    'ventas'        => $ventas,
    'devoluciones'  => $devoluciones,
    'cancelaciones' => $cancelaciones,
  ]);
}

