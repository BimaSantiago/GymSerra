<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include 'conexion.php';
$conn = ConcectarBd();
mysqli_set_charset($conn, "utf8");

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {
  case 'list':
    listarCortes($conn);
    break;
  case 'closeShift':
    cerrarTurnoX($conn);
    break;
  case 'closeDay':
    cerrarDiaZ($conn);
    break;
  case 'getCurrent': 
    obtenerCorteActual($conn);
    break;
  case 'detalle':
    detalleCorte($conn);
    break;
  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida.']);
    break;
}

// --- HELPERS ---

function tipoDbDesdeUI($tipoUI) {
  $t = strtoupper(trim((string)$tipoUI));
  return ($t === 'Z' || $t === 'Y') ? 'Y' : 'X';
}

function tipoUIDesdeDb($tipoDb) {
  $t = strtoupper(trim((string)$tipoDb));
  return $t === 'Y' ? 'Z' : 'X';
}

// CORREGIDO: Calcula el total neto considerando correctamente devoluciones y cancelaciones
function calcularTotalCorteX($conn, $idcorte) {
  // Total de ventas
  $sqlVentas = "SELECT COALESCE(SUM(total), 0) as total_ventas 
                FROM movimiento 
                WHERE idcorte = ? AND tipo = 'Venta'";
  $stmtV = mysqli_prepare($conn, $sqlVentas);
  mysqli_stmt_bind_param($stmtV, "i", $idcorte);
  mysqli_stmt_execute($stmtV);
  $resV = mysqli_stmt_get_result($stmtV);
  $totalVentas = (float)(mysqli_fetch_assoc($resV)['total_ventas'] ?? 0);

  // Total de devoluciones
  $sqlDev = "SELECT COALESCE(SUM(monto_devuelto), 0) as total_devuelto 
             FROM devolucion 
             WHERE idcorte = ?";
  $stmtD = mysqli_prepare($conn, $sqlDev);
  mysqli_stmt_bind_param($stmtD, "i", $idcorte);
  mysqli_stmt_execute($stmtD);
  $resD = mysqli_stmt_get_result($stmtD);
  $totalDevuelto = (float)(mysqli_fetch_assoc($resD)['total_devuelto'] ?? 0);

  // Total de cancelaciones (SOLO monto pendiente, no el total de la venta)
  // Para calcular el monto real cancelado, necesitamos:
  // (total_venta - monto_ya_devuelto) de cada venta cancelada
  $sqlCanc = "
    SELECT m.idmovimiento, m.total,
           COALESCE((
             SELECT SUM(dv.monto_devuelto)
             FROM devolucion dv
             WHERE dv.idmovimiento = m.idmovimiento
           ), 0) as ya_devuelto
    FROM movimiento m
    INNER JOIN cancelacion ca ON ca.idmovimiento = m.idmovimiento
    INNER JOIN motivos_cancelacion mc ON mc.idmotivo = ca.idmotivo
    WHERE m.idcorte = ? AND m.tipo = 'Venta' AND mc.tipo = 'Cancelacion'
  ";
  $stmtC = mysqli_prepare($conn, $sqlCanc);
  mysqli_stmt_bind_param($stmtC, "i", $idcorte);
  mysqli_stmt_execute($stmtC);
  $resC = mysqli_stmt_get_result($stmtC);
  
  $totalCancelado = 0;
  while ($row = mysqli_fetch_assoc($resC)) {
    $totalVenta = (float)$row['total'];
    $yaDevuelto = (float)$row['ya_devuelto'];
    // Solo restamos lo que quedaba pendiente al momento de cancelar
    $montoCancelado = $totalVenta - $yaDevuelto;
    $totalCancelado += $montoCancelado;
  }

  // Fórmula correcta: Ventas - Devoluciones - Cancelaciones_Pendientes
  $totalNeto = $totalVentas - $totalDevuelto - $totalCancelado;
  
  return $totalNeto;
}

function generarFolio($prefix) {
  return $prefix . '-' . date('Ymd') . '-' . date('His');
}

// --- FUNCIONES PRINCIPALES ---

function listarCortes($conn) {
  $page   = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $limit  = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
  $offset = ($page - 1) * $limit;

  $dateStart = $_GET['dateStart'] ?? null;
  $dateEnd   = $_GET['dateEnd'] ?? null;
  $tipoUI    = $_GET['tipo'] ?? null;

  $where = [];
  $params = [];
  $types = '';

  if ($dateStart) {
    $where[] = "DATE(c.fecha_inicio) >= ?";
    $params[] = $dateStart; $types .= 's';
  }
  if ($dateEnd) {
    $where[] = "DATE(c.fecha_inicio) <= ?";
    $params[] = $dateEnd; $types .= 's';
  }
  if ($tipoUI) {
    $tipoDb = tipoDbDesdeUI($tipoUI);
    $where[] = "c.tipo = ?";
    $params[] = $tipoDb; $types .= 's';
  }

  $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

  $sqlCount = "SELECT COUNT(*) as total FROM corte_caja c $whereSql";
  $stmtCount = mysqli_prepare($conn, $sqlCount);
  if (!empty($params)) mysqli_stmt_bind_param($stmtCount, $types, ...$params);
  mysqli_stmt_execute($stmtCount);
  $total = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtCount))['total'];

  $sqlList = "SELECT c.* FROM corte_caja c $whereSql ORDER BY c.idcorte DESC LIMIT ? OFFSET ?";
  $stmtList = mysqli_prepare($conn, $sqlList);
  
  $paramsList = $params; 
  $paramsList[] = $limit; 
  $paramsList[] = $offset;
  $typesList = $types . 'ii';
  
  mysqli_stmt_bind_param($stmtList, $typesList, ...$paramsList);
  mysqli_stmt_execute($stmtList);
  $resList = mysqli_stmt_get_result($stmtList);

  $cortes = [];
  while ($row = mysqli_fetch_assoc($resList)) {
    if (!$row['fecha_corte'] && $row['tipo'] === 'X') {
        $row['total_vendido'] = calcularTotalCorteX($conn, $row['idcorte']);
    }
    
    $row['tipo'] = tipoUIDesdeDb($row['tipo']);
    $cortes[] = $row;
  }

  echo json_encode(['success' => true, 'cortes' => $cortes, 'total' => $total]);
}

function obtenerCorteActual($conn) {
  $tipoUI = $_GET['tipo'] ?? 'X';
  $tipoDb = tipoDbDesdeUI($tipoUI);

  $sql = "SELECT * FROM corte_caja WHERE tipo = ? AND fecha_corte IS NULL ORDER BY idcorte DESC LIMIT 1";
  $stmt = mysqli_prepare($conn, $sql);
  mysqli_stmt_bind_param($stmt, "s", $tipoDb);
  mysqli_stmt_execute($stmt);
  $corte = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

  if ($corte) {
    $corte['tipo'] = tipoUIDesdeDb($corte['tipo']);
    
    if ($tipoDb === 'X') {
      $corte['total_vendido'] = calcularTotalCorteX($conn, $corte['idcorte']);
    } else {
      $sqlSum = "SELECT idcorte, fecha_corte, total_vendido FROM corte_caja WHERE corte_principal = ?";
      $stmtSum = mysqli_prepare($conn, $sqlSum);
      mysqli_stmt_bind_param($stmtSum, "i", $corte['idcorte']);
      mysqli_stmt_execute($stmtSum);
      $resSum = mysqli_stmt_get_result($stmtSum);
      
      $totalZ = 0;
      while($child = mysqli_fetch_assoc($resSum)) {
         if($child['fecha_corte']) {
            $totalZ += (float)$child['total_vendido'];
         } else {
            $totalZ += calcularTotalCorteX($conn, $child['idcorte']);
         }
      }
      $corte['total_vendido'] = $totalZ;
    }
  }

  echo json_encode(['success' => true, 'corte' => $corte]);
}

function detalleCorte($conn) {
  $idcorte = (int)($_GET['idcorte'] ?? 0);
  
  $sql = "SELECT * FROM corte_caja WHERE idcorte = ?";
  $stmt = mysqli_prepare($conn, $sql);
  mysqli_stmt_bind_param($stmt, "i", $idcorte);
  mysqli_stmt_execute($stmt);
  $info = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

  if (!$info) {
    echo json_encode(['success' => false, 'error' => 'Corte no encontrado']);
    return;
  }

  $tipoDb = $info['tipo'];
  $info['tipo'] = tipoUIDesdeDb($tipoDb);

  if (!$info['fecha_corte']) {
      if ($tipoDb === 'X') {
          $info['total_vendido'] = calcularTotalCorteX($conn, $idcorte);
      } else {
          $sqlSumZ = "SELECT idcorte FROM corte_caja WHERE corte_principal = ?";
          $stmtZ = mysqli_prepare($conn, $sqlSumZ);
          mysqli_stmt_bind_param($stmtZ, "i", $idcorte);
          mysqli_stmt_execute($stmtZ);
          $resZ = mysqli_stmt_get_result($stmtZ);
          $tot = 0;
          while($rowZ = mysqli_fetch_assoc($resZ)){
              $tot += calcularTotalCorteX($conn, $rowZ['idcorte']);
          }
          $info['total_vendido'] = $tot;
      }
  }

  $ventas = [];
  $devoluciones = [];
  $cancelaciones = [];
  $turnos = [];

  if ($tipoDb === 'X') {
    $qV = "SELECT * FROM movimiento WHERE idcorte = ? AND tipo='Venta' ORDER BY idmovimiento DESC";
    $stmtV = mysqli_prepare($conn, $qV);
    mysqli_stmt_bind_param($stmtV, "i", $idcorte);
    mysqli_stmt_execute($stmtV);
    $resV = mysqli_stmt_get_result($stmtV);
    while($r = mysqli_fetch_assoc($resV)) $ventas[] = $r;

    $qD = "SELECT * FROM devolucion WHERE idcorte = ? ORDER BY iddevolucion DESC";
    $stmtD = mysqli_prepare($conn, $qD);
    mysqli_stmt_bind_param($stmtD, "i", $idcorte);
    mysqli_stmt_execute($stmtD);
    $resD = mysqli_stmt_get_result($stmtD);
    while($r = mysqli_fetch_assoc($resD)) $devoluciones[] = $r;

    $qC = "SELECT ca.*, mc.nombre as motivo, m.total as monto_cancelado 
           FROM cancelacion ca 
           JOIN motivos_cancelacion mc ON ca.idmotivo = mc.idmotivo
           JOIN movimiento m ON ca.idmovimiento = m.idmovimiento
           WHERE m.idcorte = ? AND m.tipo='Venta' ORDER BY ca.idcancelacion DESC";
    $stmtC = mysqli_prepare($conn, $qC);
    mysqli_stmt_bind_param($stmtC, "i", $idcorte);
    mysqli_stmt_execute($stmtC);
    $resC = mysqli_stmt_get_result($stmtC);
    while($r = mysqli_fetch_assoc($resC)) $cancelaciones[] = $r;

  } else {
    $qT = "SELECT * FROM corte_caja WHERE corte_principal = ? ORDER BY idcorte ASC";
    $stmtT = mysqli_prepare($conn, $qT);
    mysqli_stmt_bind_param($stmtT, "i", $idcorte);
    mysqli_stmt_execute($stmtT);
    $resT = mysqli_stmt_get_result($stmtT);
    while($r = mysqli_fetch_assoc($resT)) {
        if(!$r['fecha_corte']) {
            $r['total_vendido'] = calcularTotalCorteX($conn, $r['idcorte']);
        }
        $r['tipo'] = 'X';
        $turnos[] = $r;
    }
  }

  echo json_encode([
    'success' => true,
    'info' => $info,
    'ventas' => $ventas,
    'devoluciones' => $devoluciones,
    'cancelaciones' => $cancelaciones,
    'turnos' => $turnos
  ]);
}

function cerrarTurnoX($conn) {
  mysqli_begin_transaction($conn);
  try {
    $res = mysqli_query($conn, "SELECT idcorte, corte_principal FROM corte_caja WHERE tipo='X' AND fecha_corte IS NULL LIMIT 1");
    $corteX = mysqli_fetch_assoc($res);
    
    $resZ = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='Y' AND fecha_corte IS NULL LIMIT 1");
    $corteZ = mysqli_fetch_assoc($resZ);
    $idZ = $corteZ ? $corteZ['idcorte'] : 0;
    
    if (!$idZ) {
        $folioZ = generarFolio('CCZ');
        mysqli_query($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio) VALUES ('$folioZ', 'Y', NOW())");
        $idZ = mysqli_insert_id($conn);
    }

    if ($corteX) {
        $totalX = calcularTotalCorteX($conn, $corteX['idcorte']);
        $stmtUpdate = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte = NOW(), total_vendido = ? WHERE idcorte = ?");
        mysqli_stmt_bind_param($stmtUpdate, "di", $totalX, $corteX['idcorte']);
        mysqli_stmt_execute($stmtUpdate);
    }

    $folioNew = generarFolio('CCX');
    $stmtNew = mysqli_prepare($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio, corte_principal) VALUES (?, 'X', NOW(), ?)");
    mysqli_stmt_bind_param($stmtNew, "si", $folioNew, $idZ);
    mysqli_stmt_execute($stmtNew);

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => 'Turno cerrado correctamente.']);

  } catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  }
}

function cerrarDiaZ($conn) {
  mysqli_begin_transaction($conn);
  try {
    $resZ = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='Y' AND fecha_corte IS NULL LIMIT 1");
    $corteZ = mysqli_fetch_assoc($resZ);
    
    if (!$corteZ) {
       $folioZ = generarFolio('CCZ');
       mysqli_query($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio) VALUES ('$folioZ', 'Y', NOW())");
       $idZ = mysqli_insert_id($conn);
    } else {
       $idZ = $corteZ['idcorte'];
    }

    $resX = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='X' AND fecha_corte IS NULL");
    if ($rowX = mysqli_fetch_assoc($resX)) {
        $totalX = calcularTotalCorteX($conn, $rowX['idcorte']);
        $stmtUpX = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte=NOW(), total_vendido=?, corte_principal=? WHERE idcorte=?");
        mysqli_stmt_bind_param($stmtUpX, "dii", $totalX, $idZ, $rowX['idcorte']);
        mysqli_stmt_execute($stmtUpX);
    }

    $sqlSum = "SELECT SUM(total_vendido) as total_dia FROM corte_caja WHERE corte_principal = ?";
    $stmtSum = mysqli_prepare($conn, $sqlSum);
    mysqli_stmt_bind_param($stmtSum, "i", $idZ);
    mysqli_stmt_execute($stmtSum);
    $totalZ = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtSum))['total_dia'] ?? 0;

    $stmtUpZ = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte=NOW(), total_vendido=? WHERE idcorte=?");
    mysqli_stmt_bind_param($stmtUpZ, "di", $totalZ, $idZ);
    mysqli_stmt_execute($stmtUpZ);

    $newFolioZ = generarFolio('CCZ');
    mysqli_query($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio) VALUES ('$newFolioZ', 'Y', NOW())");
    $newIdZ = mysqli_insert_id($conn);

    $newFolioX = generarFolio('CCX');
    $stmtNewX = mysqli_prepare($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio, corte_principal) VALUES (?, 'X', NOW(), ?)");
    mysqli_stmt_bind_param($stmtNewX, "si", $newFolioX, $newIdZ);
    mysqli_stmt_execute($stmtNewX);

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => 'Día cerrado correctamente.']);

  } catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  }
}
?>