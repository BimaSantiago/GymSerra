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
        $input = json_decode(file_get_contents('php://input'), true);
        $idcompra = $input['idcompra'];
        $idarticulo = $input['idarticulo'];
        $cantidad = $input['cantidad'];
        $precioCosto = $input['precioCosto'];
        $precioVenta = $input['precioVenta'];

        // Insertar costo y precio
        $stmtCosto = $conn->prepare("INSERT INTO lista_costo (idarticulo, precio) VALUES (?, ?)");
        $stmtCosto->bind_param("id", $idarticulo, $precioCosto);
        $stmtCosto->execute();
        $idcosto = $stmtCosto->insert_id;

        $stmtPrecio = $conn->prepare("INSERT INTO lista_precio (idarticulo, precio) VALUES (?, ?)");
        $stmtPrecio->bind_param("id", $idarticulo, $precioVenta);
        $stmtPrecio->execute();
        $idprecio = $stmtPrecio->insert_id;

        $subtotal = $cantidad * $precioCosto;

        // Insertar detalle
        $stmt = $conn->prepare("INSERT INTO detalle_compra (idcompra, idarticulo, cantidad, subtotal, idcosto, idprecio)
                                VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiidii", $idcompra, $idarticulo, $cantidad, $subtotal, $idcosto, $idprecio);
        $success = $stmt->execute();

        if ($success) {
            // Actualizar stock
            $updateStock = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
            $updateStock->bind_param("ii", $cantidad, $idarticulo);
            $updateStock->execute();

            // Recalcular total de la compra
            $conn->query("UPDATE compra 
                          SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_compra WHERE idcompra = $idcompra)
                          WHERE idcompra = $idcompra");
        }

        echo json_encode(["success" => $success]);
        break;

  case 'updateDetalle':
        $input = json_decode(file_get_contents('php://input'), true);
        $iddetalle = $input['iddetalle_compra'];
        $idcompra = $input['idcompra'];
        $nuevoArticulo = $input['idarticulo'];
        $nuevaCantidad = $input['cantidad'];
        $nuevoCosto = $input['precioCosto'];
        $nuevoPrecio = $input['precioVenta'];

        // Obtener el detalle actual
        $stmt = $conn->prepare("SELECT idarticulo, cantidad FROM detalle_compra WHERE iddetalle_compra = ?");
        $stmt->bind_param("i", $iddetalle);
        $stmt->execute();
        $old = $stmt->get_result()->fetch_assoc();

        if ($old) {
            $oldArticulo = $old['idarticulo'];
            $oldCantidad = $old['cantidad'];

            // Caso 1: mismo artículo → ajustar diferencia de stock
            if ($oldArticulo == $nuevoArticulo) {
                $diferencia = $nuevaCantidad - $oldCantidad;
                $updateStock = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
                $updateStock->bind_param("ii", $diferencia, $nuevoArticulo);
                $updateStock->execute();
            }
            // Caso 2: artículo cambiado → devolver stock al anterior y sumar al nuevo
            else {
                $devolver = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
                $devolver->bind_param("ii", $oldCantidad, $oldArticulo);
                $devolver->execute();

                $sumar = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
                $sumar->bind_param("ii", $nuevaCantidad, $nuevoArticulo);
                $sumar->execute();
            }

            // Insertar nuevos registros de precio y costo
            $stmtCosto = $conn->prepare("INSERT INTO lista_costo (idarticulo, precio) VALUES (?, ?)");
            $stmtCosto->bind_param("id", $nuevoArticulo, $nuevoCosto);
            $stmtCosto->execute();
            $idcosto = $stmtCosto->insert_id;

            $stmtPrecio = $conn->prepare("INSERT INTO lista_precio (idarticulo, precio) VALUES (?, ?)");
            $stmtPrecio->bind_param("id", $nuevoArticulo, $nuevoPrecio);
            $stmtPrecio->execute();
            $idprecio = $stmtPrecio->insert_id;

            $subtotal = $nuevaCantidad * $nuevoCosto;

            // Actualizar el detalle
            $update = $conn->prepare("UPDATE detalle_compra
                                      SET idarticulo=?, cantidad=?, subtotal=?, idcosto=?, idprecio=?
                                      WHERE iddetalle_compra=?");
            $update->bind_param("iidiii", $nuevoArticulo, $nuevaCantidad, $subtotal, $idcosto, $idprecio, $iddetalle);
            $success = $update->execute();

            if ($success) {
                // Recalcular total de compra
                $conn->query("UPDATE compra 
                              SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_compra WHERE idcompra = $idcompra)
                              WHERE idcompra = $idcompra");
            }

            echo json_encode(["success" => $success]);
        } else {
            echo json_encode(["success" => false, "error" => "Detalle no encontrado"]);
        }
        break;

  case 'deleteDetalle':
        $iddetalle = $_GET['iddetalle_compra'];

        // Obtener cantidad e idarticulo
        $stmt = $conn->prepare("SELECT idarticulo, cantidad, idcompra FROM detalle_compra WHERE iddetalle_compra = ?");
        $stmt->bind_param("i", $iddetalle);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if ($row) {
            $idarticulo = $row['idarticulo'];
            $cantidad = $row['cantidad'];
            $idcompra = $row['idcompra'];

            // Eliminar el detalle
            $del = $conn->prepare("DELETE FROM detalle_compra WHERE iddetalle_compra = ?");
            $del->bind_param("i", $iddetalle);
            $success = $del->execute();

            if ($success) {
                // Reducir stock
                $updateStock = $conn->prepare("UPDATE articulos SET stock = GREATEST(stock - ?, 0) WHERE idarticulo = ?");
                $updateStock->bind_param("ii", $cantidad, $idarticulo);
                $updateStock->execute();

                // Actualizar total de compra
                $conn->query("UPDATE compra 
                              SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_compra WHERE idcompra = $idcompra)
                              WHERE idcompra = $idcompra");
            }

            echo json_encode(["success" => $success]);
        } else {
            echo json_encode(["success" => false, "error" => "Detalle no encontrado"]);
        }
        break;

  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    break;
}
?>
