<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
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
  case 'closeShift': // Cerrar Turno (X)
    cerrarTurnoX($conn);
    break;
  case 'closeDay': // Cerrar Día (Z)
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
  // En BD: X = Turno, Y = Día (Z)
  return ($t === 'Z' || $t === 'Y') ? 'Y' : 'X';
}

function tipoUIDesdeDb($tipoDb) {
  $t = strtoupper(trim((string)$tipoDb));
  return $t === 'Y' ? 'Z' : 'X';
}

// Calcula el total neto (Ventas - Devoluciones - Cancelaciones) de un corte X
function calcularTotalCorteX($conn, $idcorte) {
  $sql = "
    SELECT
      (
        COALESCE((SELECT SUM(total) FROM movimiento WHERE idcorte = ? AND tipo = 'Venta'), 0)
        - COALESCE((SELECT SUM(monto_devuelto) FROM devolucion WHERE idcorte = ?), 0)
        - COALESCE((
            SELECT SUM(m.total)
            FROM cancelacion ca
            INNER JOIN movimiento m ON m.idmovimiento = ca.idmovimiento
            INNER JOIN motivos_cancelacion mc ON mc.idmotivo = ca.idmotivo
            WHERE m.idcorte = ? AND m.tipo = 'Venta' AND mc.tipo = 'Cancelacion'
        ), 0)
      ) AS total_neto
  ";
  $stmt = mysqli_prepare($conn, $sql);
  mysqli_stmt_bind_param($stmt, "iii", $idcorte, $idcorte, $idcorte);
  mysqli_stmt_execute($stmt);
  $res = mysqli_stmt_get_result($stmt);
  $row = mysqli_fetch_assoc($res);
  return (float)($row['total_neto'] ?? 0);
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

  // 1. Total records
  $sqlCount = "SELECT COUNT(*) as total FROM corte_caja c $whereSql";
  $stmtCount = mysqli_prepare($conn, $sqlCount);
  if (!empty($params)) mysqli_stmt_bind_param($stmtCount, $types, ...$params);
  mysqli_stmt_execute($stmtCount);
  $total = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtCount))['total'];

  // 2. Data
  // Nota: Para cortes cerrados usamos el total guardado. Para abiertos, calculamos al vuelo.
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
    // Si es X y está abierto, calcular. Si es Z y está abierto, el cálculo es complejo (suma de hijos), 
    // pero para listados históricos solemos mostrar lo guardado o 0 si es muy costoso, 
    // aqui optamos por calcular si es X. Si es Z abierto, lo dejaremos en 0 o requeriría subquery.
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

  // Buscar el último abierto de ese tipo
  $sql = "SELECT * FROM corte_caja WHERE tipo = ? AND fecha_corte IS NULL ORDER BY idcorte DESC LIMIT 1";
  $stmt = mysqli_prepare($conn, $sql);
  mysqli_stmt_bind_param($stmt, "s", $tipoDb);
  mysqli_stmt_execute($stmt);
  $corte = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

  if ($corte) {
    $corte['tipo'] = tipoUIDesdeDb($corte['tipo']);
    
    if ($tipoDb === 'X') {
      // Total de X es directo
      $corte['total_vendido'] = calcularTotalCorteX($conn, $corte['idcorte']);
    } else {
      // Total de Z (Y) es la suma de sus hijos X (Cerrados + Abierto actual)
      // Buscamos hijos X que tengan corte_principal = este corte Z
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
            // Hijo abierto, calcular al vuelo
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
  
  // Obtener info básica
  $sql = "SELECT * FROM corte_caja WHERE idcorte = ?";
  $stmt = mysqli_prepare($conn, $sql);
  mysqli_stmt_bind_param($stmt, "i", $idcorte);
  mysqli_stmt_execute($stmt);
  $info = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

  if (!$info) {
    echo json_encode(['success' => false, 'error' => 'Corte no encontrado']);
    return;
  }

  $tipoDb = $info['tipo']; // X o Y
  $info['tipo'] = tipoUIDesdeDb($tipoDb);

  // Si está abierto, calculamos el total al vuelo para mostrarlo actualizado
  if (!$info['fecha_corte']) {
      if ($tipoDb === 'X') {
          $info['total_vendido'] = calcularTotalCorteX($conn, $idcorte);
      } else {
          // Si es Z abierto, sumar hijos
          $sqlSumZ = "SELECT idcorte FROM corte_caja WHERE corte_principal = ?";
          $stmtZ = mysqli_prepare($conn, $sqlSumZ);
          mysqli_stmt_bind_param($stmtZ, "i", $idcorte);
          mysqli_stmt_execute($stmtZ);
          $resZ = mysqli_stmt_get_result($stmtZ);
          $tot = 0;
          while($rowZ = mysqli_fetch_assoc($resZ)){
              $tot += calcularTotalCorteX($conn, $rowZ['idcorte']); // Ojo: esto asume que X cerrado tiene total correcto en BD, pero calcularlo de nuevo es más seguro para consistencia
          }
          $info['total_vendido'] = $tot;
      }
  }

  $ventas = [];
  $devoluciones = [];
  $cancelaciones = [];
  $turnos = [];

  if ($tipoDb === 'X') {
    // Detalle de movimientos
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
    // Es tipo Y (Z) -> Listar Turnos (Hijos X)
    $qT = "SELECT * FROM corte_caja WHERE corte_principal = ? ORDER BY idcorte ASC";
    $stmtT = mysqli_prepare($conn, $qT);
    mysqli_stmt_bind_param($stmtT, "i", $idcorte);
    mysqli_stmt_execute($stmtT);
    $resT = mysqli_stmt_get_result($stmtT);
    while($r = mysqli_fetch_assoc($resT)) {
        // Si el hijo está abierto o cerrado, asegurarse de tener su total
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
    // 1. Obtener X abierto
    $res = mysqli_query($conn, "SELECT idcorte, corte_principal FROM corte_caja WHERE tipo='X' AND fecha_corte IS NULL LIMIT 1");
    $corteX = mysqli_fetch_assoc($res);
    
    // 2. Obtener Z abierto (si no existe, crearlo)
    $resZ = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='Y' AND fecha_corte IS NULL LIMIT 1");
    $corteZ = mysqli_fetch_assoc($resZ);
    $idZ = $corteZ ? $corteZ['idcorte'] : 0;
    
    if (!$idZ) {
        $folioZ = generarFolio('CCZ');
        mysqli_query($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio) VALUES ('$folioZ', 'Y', NOW())");
        $idZ = mysqli_insert_id($conn);
    }

    // 3. Cerrar X actual
    if ($corteX) {
        $totalX = calcularTotalCorteX($conn, $corteX['idcorte']);
        $stmtUpdate = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte = NOW(), total_vendido = ? WHERE idcorte = ?");
        mysqli_stmt_bind_param($stmtUpdate, "di", $totalX, $corteX['idcorte']);
        mysqli_stmt_execute($stmtUpdate);
    }

    // 4. Abrir Nuevo X (vinculado al mismo Z)
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
    // 1. Identificar Z abierto
    $resZ = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='Y' AND fecha_corte IS NULL LIMIT 1");
    $corteZ = mysqli_fetch_assoc($resZ);
    
    // Si no hay Z, creamos uno temporal para cerrarlo (caso borde)
    if (!$corteZ) {
       $folioZ = generarFolio('CCZ');
       mysqli_query($conn, "INSERT INTO corte_caja (folio, tipo, fecha_inicio) VALUES ('$folioZ', 'Y', NOW())");
       $idZ = mysqli_insert_id($conn);
    } else {
       $idZ = $corteZ['idcorte'];
    }

    // 2. Cerrar el X abierto pendiente (si existe) vinculado a este Z o huérfano
    // Buscamos cualquier X abierto
    $resX = mysqli_query($conn, "SELECT idcorte FROM corte_caja WHERE tipo='X' AND fecha_corte IS NULL");
    if ($rowX = mysqli_fetch_assoc($resX)) {
        $totalX = calcularTotalCorteX($conn, $rowX['idcorte']);
        $stmtUpX = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte=NOW(), total_vendido=?, corte_principal=? WHERE idcorte=?");
        mysqli_stmt_bind_param($stmtUpX, "dii", $totalX, $idZ, $rowX['idcorte']);
        mysqli_stmt_execute($stmtUpX);
    }

    // 3. Calcular Total de Z (Suma de todos los X que pertenecen a este Z)
    // Como ya cerramos el último X, todos deben estar cerrados y tener total_vendido
    $sqlSum = "SELECT SUM(total_vendido) as total_dia FROM corte_caja WHERE corte_principal = ?";
    $stmtSum = mysqli_prepare($conn, $sqlSum);
    mysqli_stmt_bind_param($stmtSum, "i", $idZ);
    mysqli_stmt_execute($stmtSum);
    $totalZ = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtSum))['total_dia'] ?? 0;

    // 4. Cerrar Z
    $stmtUpZ = mysqli_prepare($conn, "UPDATE corte_caja SET fecha_corte=NOW(), total_vendido=? WHERE idcorte=?");
    mysqli_stmt_bind_param($stmtUpZ, "di", $totalZ, $idZ);
    mysqli_stmt_execute($stmtUpZ);

    // 5. Abrir Nuevo Z y Nuevo X
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