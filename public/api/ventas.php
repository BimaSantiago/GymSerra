<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
include "conexion.php";
$conn=ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
  case 'list':
    listVentas($conn);
    break;
  case 'detalle':
    detalleVenta($conn);
    break;
  case 'listMotivos':
    listMotivos($conn);
    break;
  case 'createMotivo':
    createMotivo($conn);
    break;
  case 'createFull':
    createFullVenta($conn);
    break;
  case 'toggleCancel':
    toggleCancel($conn);
    break;
  case 'devolverParcial':
    devolverParcial($conn);
    break;
  case 'articulosVenta':
    articulosVenta($conn);
    break;
  case 'create':
  case 'addDetalle':
  case 'updateDetalle':
  case 'deleteDetalle':
    echo json_encode(['success' => false, 'error' => 'Acción deprecada.']);
    break;
  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida.']);
    break;
}

function getUltimoPrecio($conn, $idarticulo) {
  $idarticulo = (int)$idarticulo;
  $sql = "SELECT idprecio, precio FROM lista_precio WHERE idarticulo = $idarticulo ORDER BY fecha DESC, idprecio DESC LIMIT 1";
  $res = mysqli_query($conn, $sql);
  if (!$res || mysqli_num_rows($res) === 0) return null;
  $row = mysqli_fetch_assoc($res);
  mysqli_free_result($res);
  return $row;
}

function getUltimoCosto($conn, $idarticulo) {
  $idarticulo = (int)$idarticulo;
  $sql = "SELECT idcosto, precio FROM lista_costo WHERE idarticulo = $idarticulo ORDER BY fecha DESC, idcosto DESC LIMIT 1";
  $res = mysqli_query($conn, $sql);
  if (!$res || mysqli_num_rows($res) === 0) return null;
  $row = mysqli_fetch_assoc($res);
  mysqli_free_result($res);
  return $row;
}

function getDetallesVenta($conn, $idventa) {
  $idventa = (int)$idventa;
  $sql = "
    SELECT 
      d.iddetalle_movimiento AS iddetalle_venta,
      d.idarticulo,
      a.nombre AS articulo,
      d.cantidad,
      d.subtotal,
      lp.precio,
      IFNULL((SELECT SUM(dd.cantidad_devuelta) FROM devolucion_detalle dd INNER JOIN devolucion dv ON dv.iddevolucion = dd.iddevolucion WHERE dv.idmovimiento = d.idmovimiento AND dd.idarticulo = d.idarticulo), 0) AS cantidad_devuelta
    FROM detalle_movimiento d
    INNER JOIN articulos a ON d.idarticulo = a.idarticulo
    LEFT JOIN lista_precio lp ON d.idprecio = lp.idprecio
    WHERE d.idmovimiento = $idventa
    ORDER BY d.iddetalle_movimiento ASC
  ";
  $res = mysqli_query($conn, $sql);
  if (!$res) return [];
  
  $detalles = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $cantidad = (int)$row['cantidad'];
    $subtotal = (float)$row['subtotal'];
    $precio = isset($row['precio']) && $row['precio'] !== null ? (float)$row['precio'] : ($cantidad > 0 ? $subtotal / $cantidad : 0);
    
    $detalles[] = [
      'iddetalle_venta' => (int)$row['iddetalle_venta'],
      'idarticulo' => (int)$row['idarticulo'],
      'articulo' => $row['articulo'],
      'cantidad' => $cantidad,
      'subtotal' => $subtotal,
      'precio' => $precio,
      'cantidad_devuelta' => (int)$row['cantidad_devuelta'],
    ];
  }
  mysqli_free_result($res);
  return $detalles;
}

function getDetallesPreview($conn, $idventa) {
  $idventa = (int)$idventa;
  $sql = "
    SELECT a.nombre AS articulo, d.cantidad
    FROM detalle_movimiento d
    INNER JOIN articulos a ON d.idarticulo = a.idarticulo
    WHERE d.idmovimiento = $idventa
    ORDER BY d.iddetalle_movimiento ASC
    LIMIT 3
  ";
  $res = mysqli_query($conn, $sql);
  if (!$res) return [];
  
  $detalles = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $detalles[] = ['articulo' => $row['articulo'], 'cantidad' => (int)$row['cantidad']];
  }
  mysqli_free_result($res);
  return $detalles;
}

function createFullVenta($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }
  
  $idcliente = isset($body['idcliente']) ? (int)$body['idcliente'] : 0;
  $detalles = isset($body['detalles']) && is_array($body['detalles']) ? $body['detalles'] : [];
  
  if (count($detalles) === 0) {
    echo json_encode(['success' => false, 'error' => 'La venta debe tener al menos un detalle.']);
    return;
  }
  
  $sqlCorte = "SELECT idcorte FROM corte_caja WHERE fecha_corte IS NULL AND (tipo = 'X' OR tipo IS NULL) ORDER BY fecha_inicio DESC LIMIT 1";
  $resCorte = mysqli_query($conn, $sqlCorte);
  $idcorteSql = "NULL";
  
  if (!$resCorte) {
    $sqlCorte = "SELECT idcorte FROM corte_caja WHERE fecha_corte IS NULL ORDER BY fecha_inicio DESC LIMIT 1";
    $resCorte = mysqli_query($conn, $sqlCorte);
  }
  
  if ($resCorte && mysqli_num_rows($resCorte) > 0) {
    $rowCorte = mysqli_fetch_assoc($resCorte);
    mysqli_free_result($resCorte);
    $idcorteSql = (int)$rowCorte['idcorte'];
  }
  
  mysqli_begin_transaction($conn);
  
  try {
    $idclienteSql = $idcliente > 0 ? $idcliente : "NULL";
    $sqlMov = "INSERT INTO movimiento (comentario, fecha, total, iduser, idcliente, idcorte, idproveedor, tipo) VALUES ('', NOW(), 0, NULL, $idclienteSql, $idcorteSql, NULL, 'Venta')";
    if (!mysqli_query($conn, $sqlMov)) throw new Exception('Error al crear venta: ' . mysqli_error($conn));
    
    $idventa = (int)mysqli_insert_id($conn);
    $total = 0.0;
    
    foreach ($detalles as $d) {
      $idarticulo = isset($d['idarticulo']) ? (int)$d['idarticulo'] : 0;
      $cantidad = isset($d['cantidad']) ? (int)$d['cantidad'] : 0;
      
      if ($idarticulo <= 0 || $cantidad <= 0) throw new Exception('Detalle inválido en la venta.');
      
      $sqlStock = "SELECT stock FROM articulos WHERE idarticulo = $idarticulo";
      $resStock = mysqli_query($conn, $sqlStock);
      if (!$resStock || mysqli_num_rows($resStock) === 0) throw new Exception('Artículo no encontrado (id ' . $idarticulo . ').');
      $rowStock = mysqli_fetch_assoc($resStock);
      mysqli_free_result($resStock);
      $stockActual = (int)$rowStock['stock'];
      
      if ($stockActual < $cantidad) throw new Exception('Stock insuficiente para el artículo ' . $idarticulo);
      
      $precioRow = getUltimoPrecio($conn, $idarticulo);
      if (!$precioRow) throw new Exception('No se encontró un precio para el artículo ' . $idarticulo);
      $costoRow = getUltimoCosto($conn, $idarticulo);
      if (!$costoRow) throw new Exception('No se encontró un costo para el artículo ' . $idarticulo);
      
      $idprecio = (int)$precioRow['idprecio'];
      $precio = (float)$precioRow['precio'];
      $idcosto = (int)$costoRow['idcosto'];
      $subtotal = $precio * $cantidad;
      $total += $subtotal;
      
      $sqlDet = "INSERT INTO detalle_movimiento (idmovimiento, idarticulo, conteo, diferencia, subtotal, cantidad, idcosto, idprecio) VALUES ($idventa, $idarticulo, 0, 0, $subtotal, $cantidad, $idcosto, $idprecio)";
      if (!mysqli_query($conn, $sqlDet)) throw new Exception('Error al insertar detalle: ' . mysqli_error($conn));
      
      $sqlUStock = "UPDATE articulos SET stock = stock - $cantidad WHERE idarticulo = $idarticulo";
      if (!mysqli_query($conn, $sqlUStock)) throw new Exception('Error al actualizar stock: ' . mysqli_error($conn));
    }
    
    $sqlUTotal = "UPDATE movimiento SET total = $total, idcliente = $idclienteSql WHERE idmovimiento = $idventa";
    if (!mysqli_query($conn, $sqlUTotal)) throw new Exception('Error al actualizar total de venta: ' . mysqli_error($conn));
    
    mysqli_commit($conn);
    
    $info = getInfoVenta($conn, $idventa);
    $detalles = getDetallesVenta($conn, $idventa);
    
    echo json_encode(['success' => true, 'idventa' => $idventa, 'info' => $info, 'detalles' => $detalles]);
  } catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  }
}

function listVentas($conn) {
  $sql = "
    SELECT
      m.idmovimiento AS idventa,
      m.fecha,
      m.total,
      c.nombre_completo AS cliente,
      CASE WHEN EXISTS (SELECT 1 FROM cancelacion ca INNER JOIN motivos_cancelacion mc ON ca.idmotivo = mc.idmotivo WHERE ca.idmovimiento = m.idmovimiento AND mc.tipo = 'Cancelacion') THEN 1 ELSE 0 END AS cancelada
    FROM movimiento m
    LEFT JOIN cliente c ON m.idcliente = c.idcliente
    WHERE m.tipo = 'Venta'
    ORDER BY m.fecha DESC, m.idmovimiento DESC
  ";
  
  $res = mysqli_query($conn, $sql);
  if (!$res) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener ventas: ' . mysqli_error($conn)]);
    return;
  }
  
  $ventas = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $idventa = (int)$row['idventa'];
    $row['idventa'] = $idventa;
    $row['total'] = (float)$row['total'];
    $row['cancelada'] = (int)$row['cancelada'];
    $row['detalles'] = getDetallesPreview($conn, $idventa);
    $ventas[] = $row;
  }
  mysqli_free_result($res);
  
  echo json_encode(['success' => true, 'ventas' => $ventas]);
}

function getInfoVenta($conn, $idventa) {
  $idventa = (int)$idventa;
  $sql = "
    SELECT
      m.idmovimiento AS idventa,
      m.fecha,
      m.total,
      m.idcliente,
      c.nombre_completo AS cliente,
      CASE WHEN EXISTS (SELECT 1 FROM cancelacion ca INNER JOIN motivos_cancelacion mc ON ca.idmotivo = mc.idmotivo WHERE ca.idmovimiento = m.idmovimiento AND mc.tipo = 'Cancelacion') THEN 1 ELSE 0 END AS cancelada
    FROM movimiento m
    LEFT JOIN cliente c ON m.idcliente = c.idcliente
    WHERE m.idmovimiento = $idventa AND m.tipo = 'Venta'
    LIMIT 1
  ";
  $res = mysqli_query($conn, $sql);
  if (!$res || mysqli_num_rows($res) === 0) return null;
  $row = mysqli_fetch_assoc($res);
  mysqli_free_result($res);
  
  $row['idventa'] = (int)$row['idventa'];
  $row['total'] = (float)$row['total'];
  $row['idcliente'] = $row['idcliente'] !== null ? (int)$row['idcliente'] : null;
  $row['cancelada'] = (int)$row['cancelada'];
  
  return $row;
}

function getDevolucionesVenta($conn, $idventa) {
  $idventa = (int)$idventa;
  $sql = "
    SELECT 
      dd.iddevolucion_detalle,
      dv.fecha_devolucion,
      a.nombre AS articulo,
      dd.cantidad_devuelta,
      dd.subtotal,
      mc.nombre AS motivo
    FROM devolucion_detalle dd
    INNER JOIN devolucion dv ON dv.iddevolucion = dd.iddevolucion
    INNER JOIN articulos a ON dd.idarticulo = a.idarticulo
    INNER JOIN motivos_cancelacion mc ON dd.idmotivo = mc.idmotivo
    WHERE dv.idmovimiento = $idventa
    ORDER BY dv.fecha_devolucion DESC, dd.iddevolucion_detalle ASC
  ";
  $res = mysqli_query($conn, $sql);
  if (!$res) return [];
  
  $rows = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $row['iddevolucion_detalle'] = (int)$row['iddevolucion_detalle'];
    $row['cantidad_devuelta'] = (int)$row['cantidad_devuelta'];
    $row['subtotal'] = (float)$row['subtotal'];
    $rows[] = $row;
  }
  mysqli_free_result($res);
  return $rows;
}

function detalleVenta($conn) {
  $idventa = isset($_GET['idventa']) ? (int)$_GET['idventa'] : 0;
  if ($idventa <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de venta no válido.']);
    return;
  }
  
  $info = getInfoVenta($conn, $idventa);
  if (!$info) {
    echo json_encode(['success' => false, 'error' => 'Venta no encontrada.']);
    return;
  }
  
  $detalles = getDetallesVenta($conn, $idventa);
  $devoluciones = getDevolucionesVenta($conn, $idventa);
  
  echo json_encode(['success' => true, 'info' => $info, 'detalles' => $detalles, 'devoluciones' => $devoluciones]);
}

function listMotivos($conn) {
  $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : '';
  $tipo = mysqli_real_escape_string($conn, $tipo);
  
  if ($tipo === '') {
    echo json_encode(['success' => false, 'error' => 'Tipo de motivo requerido.']);
    return;
  }
  
  $sql = "SELECT idmotivo, nombre, tipo FROM motivos_cancelacion WHERE tipo = '$tipo' ORDER BY nombre ASC";
  $res = mysqli_query($conn, $sql);
  if (!$res) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener motivos: ' . mysqli_error($conn)]);
    return;
  }
  
  $motivos = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $motivos[] = $row;
  }
  mysqli_free_result($res);
  
  echo json_encode(['success' => true, 'motivos' => $motivos]);
}

function createMotivo($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }
  
  $tipo = isset($body['tipo']) ? trim($body['tipo']) : '';
  $nombre = isset($body['nombre']) ? trim($body['nombre']) : '';
  
  if ($tipo === '' || $nombre === '') {
    echo json_encode(['success' => false, 'error' => 'Tipo y nombre de motivo son requeridos.']);
    return;
  }
  
  $tipoEsc = mysqli_real_escape_string($conn, $tipo);
  $nombreEsc = mysqli_real_escape_string($conn, $nombre);
  
  $sql = "INSERT INTO motivos_cancelacion (nombre, tipo) VALUES ('$nombreEsc', '$tipoEsc')";
  if (!mysqli_query($conn, $sql)) {
    echo json_encode(['success' => false, 'error' => 'Error al crear motivo: ' . mysqli_error($conn)]);
    return;
  }
  
  $id = (int)mysqli_insert_id($conn);
  echo json_encode(['success' => true, 'motivo' => ['idmotivo' => $id, 'nombre' => $nombre, 'tipo' => $tipo]]);
}

function toggleCancel($conn) {
  $idventa = isset($_GET['idventa']) ? (int)$_GET['idventa'] : 0;
  if ($idventa <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de venta no válido.']);
    return;
  }
  
  $body = json_decode(file_get_contents('php://input'), true);
  $idmotivoReq = isset($body['idmotivo']) ? (int)$body['idmotivo'] : 0;
  $descripcion = isset($body['descripcion']) ? mysqli_real_escape_string($conn, $body['descripcion']) : 'Cancelación de venta';
  
  $sqlCheck = "SELECT COUNT(*) AS total FROM cancelacion c INNER JOIN motivos_cancelacion mc ON c.idmotivo = mc.idmotivo WHERE c.idmovimiento = $idventa AND mc.tipo = 'Cancelacion'";
  $resCheck = mysqli_query($conn, $sqlCheck);
  if (!$resCheck) {
    echo json_encode(['success' => false, 'error' => 'Error al consultar cancelación']);
    return;
  }
  $rowCheck = mysqli_fetch_assoc($resCheck);
  mysqli_free_result($resCheck);
  $estaCancelada = ((int)$rowCheck['total'] > 0);
  
  if ($estaCancelada) {
    $sqlDelCan = "DELETE c FROM cancelacion c INNER JOIN motivos_cancelacion mc ON c.idmotivo = mc.idmotivo WHERE c.idmovimiento = $idventa AND mc.tipo = 'Cancelacion'";
    mysqli_query($conn, $sqlDelCan);
    
    $sqlDet = "SELECT idarticulo, cantidad FROM detalle_movimiento WHERE idmovimiento = $idventa";
    $resDet = mysqli_query($conn, $sqlDet);
    if ($resDet) {
      while ($row = mysqli_fetch_assoc($resDet)) {
        $idarticulo = (int)$row['idarticulo'];
        $cantidadOriginal = (int)$row['cantidad'];
        
        $sqlDevPrev = "SELECT IFNULL(SUM(dd.cantidad_devuelta), 0) AS devuelto FROM devolucion_detalle dd INNER JOIN devolucion dv ON dv.iddevolucion = dd.iddevolucion WHERE dv.idmovimiento = $idventa AND dd.idarticulo = $idarticulo";
        $resDevPrev = mysqli_query($conn, $sqlDevPrev);
        $rowDevPrev = $resDevPrev ? mysqli_fetch_assoc($resDevPrev) : ['devuelto' => 0];
        if ($resDevPrev) mysqli_free_result($resDevPrev);
        
        $yaDevuelto = (int)$rowDevPrev['devuelto'];
        $pendiente = $cantidadOriginal - $yaDevuelto;
        
        if ($pendiente > 0) {
          mysqli_query($conn, "UPDATE articulos SET stock = stock - $pendiente WHERE idarticulo = $idarticulo");
        }
      }
      mysqli_free_result($resDet);
    }
  } else {
    $idmotivo = $idmotivoReq;
    if ($idmotivo <= 0) {
      $sqlMot = "SELECT idmotivo FROM motivos_cancelacion WHERE tipo = 'Cancelacion' ORDER BY idmotivo ASC LIMIT 1";
      $resMot = mysqli_query($conn, $sqlMot);
      if (!$resMot || mysqli_num_rows($resMot) === 0) {
        echo json_encode(['success' => false, 'error' => 'No se encontró motivo de cancelación']);
        return;
      }
      $rowMot = mysqli_fetch_assoc($resMot);
      mysqli_free_result($resMot);
      $idmotivo = (int)$rowMot['idmotivo'];
    }
    
    $sqlCorte = "SELECT idcorte FROM corte_caja WHERE fecha_corte IS NULL ORDER BY fecha_inicio DESC LIMIT 1";
    $resCorte = mysqli_query($conn, $sqlCorte);
    if ($resCorte && mysqli_num_rows($resCorte) > 0) {
      $rowCorte = mysqli_fetch_assoc($resCorte);
      mysqli_free_result($resCorte);
      $idcorte = (int)$rowCorte['idcorte'];
      mysqli_query($conn, "UPDATE movimiento SET idcorte = $idcorte WHERE idmovimiento = $idventa");
    }
    
    $sqlIns = "INSERT INTO cancelacion (idmovimiento, idmotivo, descripcion) VALUES ($idventa, $idmotivo, '$descripcion')";
    if (!mysqli_query($conn, $sqlIns)) {
      echo json_encode(['success' => false, 'error' => 'Error al registrar cancelación: ' . mysqli_error($conn)]);
      return;
    }
    
    $sqlDet = "SELECT idarticulo, cantidad FROM detalle_movimiento WHERE idmovimiento = $idventa";
    $resDet = mysqli_query($conn, $sqlDet);
    if ($resDet) {
      while ($row = mysqli_fetch_assoc($resDet)) {
        $idarticulo = (int)$row['idarticulo'];
        $cantidadOriginal = (int)$row['cantidad'];
        
        $sqlDevPrev = "SELECT IFNULL(SUM(dd.cantidad_devuelta), 0) AS devuelto FROM devolucion_detalle dd INNER JOIN devolucion dv ON dv.iddevolucion = dd.iddevolucion WHERE dv.idmovimiento = $idventa AND dd.idarticulo = $idarticulo";
        $resDevPrev = mysqli_query($conn, $sqlDevPrev);
        $rowDevPrev = $resDevPrev ? mysqli_fetch_assoc($resDevPrev) : ['devuelto' => 0];
        if ($resDevPrev) mysqli_free_result($resDevPrev);
        
        $yaDevuelto = (int)$rowDevPrev['devuelto'];
        $pendiente = $cantidadOriginal - $yaDevuelto;
        
        if ($pendiente > 0) {
          mysqli_query($conn, "UPDATE articulos SET stock = stock + $pendiente WHERE idarticulo = $idarticulo");
        }
      }
      mysqli_free_result($resDet);
    }
  }
  
  $info = getInfoVenta($conn, $idventa);
  echo json_encode(['success' => true, 'info' => $info]);
}

function devolverParcial($conn) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido.']);
    return;
  }
  
  $idventa = isset($body['idventa']) ? (int)$body['idventa'] : 0;
  $iddetalle_venta = isset($body['iddetalle_venta']) ? (int)$body['iddetalle_venta'] : 0;
  $cantidadDev = isset($body['cantidad']) ? (int)$body['cantidad'] : 0;
  $idmotivoReq = isset($body['idmotivo']) ? (int)$body['idmotivo'] : 0;
  
  if ($idventa <= 0 || $iddetalle_venta <= 0 || $cantidadDev <= 0) {
    echo json_encode(['success' => false, 'error' => 'Datos insuficientes.']);
    return;
  }
  
  $sqlDet = "SELECT idarticulo, cantidad, subtotal, idprecio FROM detalle_movimiento WHERE iddetalle_movimiento = $iddetalle_venta AND idmovimiento = $idventa LIMIT 1";
  $resDet = mysqli_query($conn, $sqlDet);
  if (!$resDet || mysqli_num_rows($resDet) === 0) {
    echo json_encode(['success' => false, 'error' => 'Detalle no encontrado.']);
    return;
  }
  $rowDet = mysqli_fetch_assoc($resDet);
  mysqli_free_result($resDet);
  
  $idarticulo = (int)$rowDet['idarticulo'];
  $cantidadOriginal = (int)$rowDet['cantidad'];
  $subtotalOriginal = (float)$rowDet['subtotal'];
  $idprecio = (int)$rowDet['idprecio'];
  
  $sqlDevPrev = "SELECT IFNULL(SUM(dd.cantidad_devuelta), 0) AS devuelto FROM devolucion_detalle dd INNER JOIN devolucion dv ON dv.iddevolucion = dd.iddevolucion WHERE dv.idmovimiento = $idventa AND dd.idarticulo = $idarticulo";
  $resDevPrev = mysqli_query($conn, $sqlDevPrev);
  $rowDevPrev = $resDevPrev ? mysqli_fetch_assoc($resDevPrev) : ['devuelto' => 0];
  if ($resDevPrev) mysqli_free_result($resDevPrev);
  
  $yaDevuelto = (int)$rowDevPrev['devuelto'];
  $pendiente = $cantidadOriginal - $yaDevuelto;
  
  if ($pendiente <= 0) {
    echo json_encode(['success' => false, 'error' => 'Este artículo ya fue devuelto por completo.']);
    return;
  }
  
  if ($cantidadDev > $pendiente) {
    echo json_encode(['success' => false, 'error' => 'La cantidad a devolver excede la cantidad pendiente.']);
    return;
  }
  
  $sqlCorte = "SELECT idcorte FROM corte_caja WHERE fecha_corte IS NULL ORDER BY fecha_inicio DESC LIMIT 1";
  $resCorte = mysqli_query($conn, $sqlCorte);
  if (!$resCorte || mysqli_num_rows($resCorte) === 0) {
    echo json_encode(['success' => false, 'error' => 'No hay corte de caja abierto para registrar la devolución.']);
    return;
  }
  $rowCorte = mysqli_fetch_assoc($resCorte);
  mysqli_free_result($resCorte);
  $idcorte = (int)$rowCorte['idcorte'];
  
  $idmotivo = $idmotivoReq;
  if ($idmotivo <= 0) {
    $sqlMot = "SELECT idmotivo FROM motivos_cancelacion WHERE tipo = 'Devolucion' ORDER BY idmotivo ASC LIMIT 1";
    $resMot = mysqli_query($conn, $sqlMot);
    if (!$resMot || mysqli_num_rows($resMot) === 0) {
      echo json_encode(['success' => false, 'error' => 'No se encontró motivo de devolución (tipo Devolucion).']);
      return;
    }
    $rowMot = mysqli_fetch_assoc($resMot);
    mysqli_free_result($resMot);
    $idmotivo = (int)$rowMot['idmotivo'];
  }
  
  $montoUnit = $cantidadOriginal > 0 ? ($subtotalOriginal / $cantidadOriginal) : 0;
  $montoDev = $montoUnit * $cantidadDev;
  
  mysqli_begin_transaction($conn);
  
  try {
    $sqlDev = "SELECT iddevolucion FROM devolucion WHERE idmovimiento = $idventa AND idcorte = $idcorte LIMIT 1";
    $resDev = mysqli_query($conn, $sqlDev);
    if ($resDev && mysqli_num_rows($resDev) > 0) {
      $rowDev = mysqli_fetch_assoc($resDev);
      mysqli_free_result($resDev);
      $iddevolucion = (int)$rowDev['iddevolucion'];
      
      $sqlUDev = "UPDATE devolucion SET monto_devuelto = monto_devuelto + $montoDev WHERE iddevolucion = $iddevolucion";
      if (!mysqli_query($conn, $sqlUDev)) {
        throw new Exception('Error al actualizar monto de devolución: ' . mysqli_error($conn));
      }
    } else {
      $sqlNewDev = "INSERT INTO devolucion (idmovimiento, monto_devuelto, fecha_devolucion, idcorte) VALUES ($idventa, $montoDev, NOW(), $idcorte)";
      if (!mysqli_query($conn, $sqlNewDev)) {
        throw new Exception('Error al crear cabecera de devolución: ' . mysqli_error($conn));
      }
      $iddevolucion = (int)mysqli_insert_id($conn);
    }
    
    $sqlDevDet = "INSERT INTO devolucion_detalle (iddevolucion, idarticulo, idprecio, idmotivo, cantidad_devuelta, subtotal) VALUES ($iddevolucion, $idarticulo, $idprecio, $idmotivo, $cantidadDev, $montoDev)";
    if (!mysqli_query($conn, $sqlDevDet)) {
      throw new Exception('Error al registrar detalle de devolución: ' . mysqli_error($conn));
    }
    
    $sqlStock = "UPDATE articulos SET stock = stock + $cantidadDev WHERE idarticulo = $idarticulo";
    if (!mysqli_query($conn, $sqlStock)) {
      throw new Exception('Error al actualizar stock en devolución: ' . mysqli_error($conn));
    }
    
    mysqli_commit($conn);
    
    $info = getInfoVenta($conn, $idventa);
    $detalles = getDetallesVenta($conn, $idventa);
    $devoluciones = getDevolucionesVenta($conn, $idventa);
    
    echo json_encode(['success' => true, 'info' => $info, 'detalles' => $detalles, 'devoluciones' => $devoluciones]);
  } catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  }
}

function articulosVenta($conn) {
  $sql = "
    SELECT
      a.idarticulo,
      a.nombre,
      a.stock,
      a.descripcion2,
      (SELECT lp.precio FROM lista_precio lp WHERE lp.idarticulo = a.idarticulo ORDER BY lp.fecha DESC, lp.idprecio DESC LIMIT 1) AS precio
    FROM articulos a
    WHERE a.estado = 'Activo' AND a.descripcion2 = 'Venta'
    ORDER BY a.nombre ASC
  ";
  $res = mysqli_query($conn, $sql);
  if (!$res) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener artículos de venta: ' . mysqli_error($conn)]);
    return;
  }
  
  $articulos = [];
  while ($row = mysqli_fetch_assoc($res)) {
    $row['idarticulo'] = (int)$row['idarticulo'];
    $row['stock'] = isset($row['stock']) ? (int)$row['stock'] : 0;
    $row['precio'] = isset($row['precio']) ? (float)$row['precio'] : 0.0;
    $articulos[] = $row;
  }
  mysqli_free_result($res);
  
  echo json_encode(['success' => true, 'articulos' => $articulos]);
}
?>