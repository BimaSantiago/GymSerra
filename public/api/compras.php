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

    case 'list':
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $limit;

    $query = "
      SELECT c.idcompra, DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha, 
             c.total, p.nombre AS proveedor
      FROM compra c
      JOIN proveedores p ON c.idprovedor = p.idprovedor
      WHERE p.nombre LIKE ? OR c.fecha LIKE ?
      ORDER BY c.idcompra ASC
      LIMIT ? OFFSET ?
    ";

    $stmt = $conn->prepare($query);
    $like = "%$search%";
    $stmt->bind_param("ssii", $like, $like, $limit, $offset);
    $stmt->execute();
    $compras = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $stmtTotal = $conn->prepare("
      SELECT COUNT(*) AS total
      FROM compra c
      JOIN proveedores p ON c.idprovedor = p.idprovedor
      WHERE p.nombre LIKE ? OR c.fecha LIKE ?
    ");
    $stmtTotal->bind_param("ss", $like, $like);
    $stmtTotal->execute();
    $total = $stmtTotal->get_result()->fetch_assoc()['total'];

    echo json_encode(['success' => true, 'compras' => $compras, 'total' => $total]);
    break;

case 'create':
    $data = json_decode(file_get_contents("php://input"), true);
    $idprovedor = intval($data['idprovedor'] ?? 0);
    if ($idprovedor <= 0) {
      echo json_encode(['success' => false, 'error' => 'Debe seleccionar un proveedor.']);
      exit;
    }

    try {
      $stmt = $conn->prepare("INSERT INTO compra (idprovedor, total) VALUES (?, 0)");
      $stmt->bind_param("i", $idprovedor);
      $stmt->execute();
      echo json_encode(['success' => true, 'idcompra' => $conn->insert_id]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al crear compra: ' . $e->getMessage()]);
    }
    break;

  case 'detalle':
    $idcompra = intval($_GET['idcompra'] ?? 0);
    if ($idcompra <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID inválido']);
      exit;
    }

    // Datos generales de la compra
    $stmtCompra = $conn->prepare("
      SELECT c.idcompra, c.fecha, c.total, p.nombre AS proveedor
      FROM compra c
      JOIN proveedores p ON p.idprovedor = c.idprovedor
      WHERE c.idcompra = ?
    ");
    $stmtCompra->bind_param("i", $idcompra);
    $stmtCompra->execute();
    $info = $stmtCompra->get_result()->fetch_assoc();

    // Detalles con costo y precio reales
    $stmt = $conn->prepare("
      SELECT d.iddetalle_compra, d.idarticulo, a.nombre AS articulo,
             d.cantidad, d.subtotal, lc.precio AS costo, lp.precio AS precio
      FROM detalle_compra d
      JOIN articulos a ON a.idarticulo = d.idarticulo
      JOIN lista_costo lc ON lc.idcosto = d.idcosto
      JOIN lista_precio lp ON lp.idprecio = d.idprecio
      WHERE d.idcompra = ?
      ORDER BY d.iddetalle_compra ASC
    ");
    $stmt->bind_param("i", $idcompra);
    $stmt->execute();
    $detalles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $total = array_sum(array_column($detalles, 'subtotal'));
    echo json_encode([
      'success' => true,
      'info' => $info,
      'detalles' => $detalles,
      'total' => $total
    ]);
    break;

    case 'get':
    $idcompra = intval($_GET['idcompra'] ?? 0);
    if ($idcompra <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID inválido']);
      exit;
    }

    $query = "
      SELECT c.idcompra, c.idprovedor, p.nombre AS proveedor, c.total, c.fecha
      FROM compra c
      JOIN proveedores p ON c.idprovedor = p.idprovedor
      WHERE c.idcompra = ?
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idcompra);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();

    if ($data) {
      echo json_encode(['success' => true, 'data' => $data]);
    } else {
      echo json_encode(['success' => false, 'error' => 'Compra no encontrada']);
    }
    break;

  case 'update':
    $data = json_decode(file_get_contents("php://input"), true);
    $idcompra = intval($data['idcompra'] ?? 0);
    $idprovedor = intval($data['idprovedor'] ?? 0);

    if ($idcompra <= 0 || $idprovedor <= 0) {
      echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
      exit;
    }

    try {
      $stmt = $conn->prepare("UPDATE compra SET idprovedor = ? WHERE idcompra = ?");
      $stmt->bind_param("ii", $idprovedor, $idcompra);
      $stmt->execute();

      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al actualizar proveedor: ' . $e->getMessage()]);
    }
    break;

  case 'addDetalle':
    $data = json_decode(file_get_contents("php://input"), true);
    $idcompra = intval($data['idcompra'] ?? 0);
    $idarticulo = intval($data['idarticulo'] ?? 0);
    $cantidad = intval($data['cantidad'] ?? 0);
    $precioCosto = floatval($data['precioCosto'] ?? 0);
    $precioVenta = floatval($data['precioVenta'] ?? 0);

    if ($idcompra <= 0 || $idarticulo <= 0 || $cantidad <= 0 || $precioCosto <= 0) {
      echo json_encode(['success' => false, 'error' => 'Datos incompletos o inválidos']);
      exit;
    }

    $conn->begin_transaction();
    try {
      // Insertar lista_costo y lista_precio
      $stmtCosto = $conn->prepare("INSERT INTO lista_costo (idarticulo, precio) VALUES (?, ?)");
      $stmtCosto->bind_param("id", $idarticulo, $precioCosto);
      $stmtCosto->execute();
      $idcosto = $conn->insert_id;

      $stmtPrecio = $conn->prepare("INSERT INTO lista_precio (idarticulo, precio) VALUES (?, ?)");
      $stmtPrecio->bind_param("id", $idarticulo, $precioVenta);
      $stmtPrecio->execute();
      $idprecio = $conn->insert_id;

      $subtotal = $cantidad * $precioCosto;

      $stmtDet = $conn->prepare("
        INSERT INTO detalle_compra (idcompra, idarticulo, subtotal, cantidad, idcosto, idprecio)
        VALUES (?, ?, ?, ?, ?, ?)
      ");
      $stmtDet->bind_param("iidiii", $idcompra, $idarticulo, $subtotal, $cantidad, $idcosto, $idprecio);
      $stmtDet->execute();

      $stmtTotal = $conn->prepare("
        UPDATE compra SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_compra WHERE idcompra = ?) 
        WHERE idcompra = ?
      ");
      $stmtTotal->bind_param("ii", $idcompra, $idcompra);
      $stmtTotal->execute();

      $conn->commit();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      $conn->rollback();
      echo json_encode(['success' => false, 'error' => 'Error al agregar detalle: ' . $e->getMessage()]);
    }
    break;

  case 'updateDetalle':
    $data = json_decode(file_get_contents("php://input"), true);
    $iddetalle = intval($data['iddetalle_compra'] ?? 0);
    $idcompra = intval($data['idcompra'] ?? 0);
    $idarticulo = intval($data['idarticulo'] ?? 0);
    $cantidad = intval($data['cantidad'] ?? 0);
    $precioCosto = floatval($data['precioCosto'] ?? 0);
    $precioVenta = floatval($data['precioVenta'] ?? 0);

    if ($iddetalle <= 0 || $idcompra <= 0) {
      echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
      exit;
    }

    $subtotal = $cantidad * $precioCosto;

    $conn->begin_transaction();
    try {
      // Actualizar precios
      $stmtIDs = $conn->prepare("SELECT idcosto, idprecio FROM detalle_compra WHERE iddetalle_compra=?");
      $stmtIDs->bind_param("i", $iddetalle);
      $stmtIDs->execute();
      $ids = $stmtIDs->get_result()->fetch_assoc();

      if ($ids) {
        $stmtCosto = $conn->prepare("UPDATE lista_costo SET precio=? WHERE idcosto=?");
        $stmtCosto->bind_param("di", $precioCosto, $ids['idcosto']);
        $stmtCosto->execute();

        $stmtPrecio = $conn->prepare("UPDATE lista_precio SET precio=? WHERE idprecio=?");
        $stmtPrecio->bind_param("di", $precioVenta, $ids['idprecio']);
        $stmtPrecio->execute();
      }

      // Actualizar detalle
      $stmt = $conn->prepare("
        UPDATE detalle_compra 
        SET idarticulo=?, cantidad=?, subtotal=? 
        WHERE iddetalle_compra=?
      ");
      $stmt->bind_param("iidi", $idarticulo, $cantidad, $subtotal, $iddetalle);
      $stmt->execute();

      // Recalcular total
      $stmtTotal = $conn->prepare("
        UPDATE compra 
        SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_compra WHERE idcompra = ?)
        WHERE idcompra = ?
      ");
      $stmtTotal->bind_param("ii", $idcompra, $idcompra);
      $stmtTotal->execute();

      $conn->commit();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      $conn->rollback();
      echo json_encode(['success' => false, 'error' => 'Error al actualizar detalle: ' . $e->getMessage()]);
    }
    break;

  case 'deleteDetalle':
    $iddetalle = intval($_GET['iddetalle_compra'] ?? 0);
    if ($iddetalle <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID inválido']);
      exit;
    }

    $getCompra = $conn->prepare("SELECT idcompra FROM detalle_compra WHERE iddetalle_compra = ?");
    $getCompra->bind_param("i", $iddetalle);
    $getCompra->execute();
    $row = $getCompra->get_result()->fetch_assoc();
    $idcompra = $row['idcompra'] ?? 0;

    $conn->begin_transaction();
    try {
      $stmt = $conn->prepare("DELETE FROM detalle_compra WHERE iddetalle_compra = ?");
      $stmt->bind_param("i", $iddetalle);
      $stmt->execute();

      $stmtTotal = $conn->prepare("
        UPDATE compra 
        SET total = (SELECT IFNULL(SUM(subtotal), 0) FROM detalle_compra WHERE idcompra = ?) 
        WHERE idcompra = ?
      ");
      $stmtTotal->bind_param("ii", $idcompra, $idcompra);
      $stmtTotal->execute();

      $conn->commit();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      $conn->rollback();
      echo json_encode(['success' => false, 'error' => 'Error al eliminar detalle: ' . $e->getMessage()]);
    }
    break;

  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    break;
}
?>
