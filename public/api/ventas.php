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
 case 'create':
        $stmt = $conn->prepare("INSERT INTO ventas (total) VALUES (0)");
        $success = $stmt->execute();
        $idventa = $stmt->insert_id;
        echo json_encode(["success" => $success, "idventa" => $idventa]);
        break;

    case 'list':
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $search = $_GET['search'] ?? '';
        $offset = ($page - 1) * $limit;

        $query = "SELECT idventa, fecha, total 
                  FROM ventas 
                  WHERE fecha LIKE ? 
                  ORDER BY fecha DESC 
                  LIMIT ?, ?";
        $stmt = $conn->prepare($query);
        $like = "%$search%";
        $stmt->bind_param("sii", $like, $offset, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $ventas = [];
        while ($row = $result->fetch_assoc()) {
            $ventas[] = $row;
        }

        $countStmt = $conn->prepare("SELECT COUNT(*) AS total FROM ventas WHERE fecha LIKE ?");
        $countStmt->bind_param("s", $like);
        $countStmt->execute();
        $total = $countStmt->get_result()->fetch_assoc()['total'];

        echo json_encode(["success" => true, "ventas" => $ventas, "total" => $total]);
        break;

    case 'detalle':
        $idventa = $_GET['idventa'];

        $stmt = $conn->prepare("SELECT idventa, fecha, total FROM ventas WHERE idventa = ?");
        $stmt->bind_param("i", $idventa);
        $stmt->execute();
        $info = $stmt->get_result()->fetch_assoc();

        $query = "SELECT dv.iddetalle_venta, dv.idarticulo, a.nombre AS articulo,
                         dv.cantidad, dv.subtotal, lp.precio
                  FROM detalle_venta dv
                  JOIN articulos a ON a.idarticulo = dv.idarticulo
                  JOIN lista_precio lp ON lp.idprecio = dv.idprecio
                  WHERE dv.idventa = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $idventa);
        $stmt->execute();
        $result = $stmt->get_result();

        $detalles = [];
        while ($row = $result->fetch_assoc()) {
            $detalles[] = $row;
        }

        echo json_encode(["success" => true, "info" => $info, "detalles" => $detalles]);
        break;

    case 'addDetalle':
        $input = json_decode(file_get_contents('php://input'), true);
        $idventa = $input['idventa'];
        $idarticulo = $input['idarticulo'];
        $cantidad = $input['cantidad'];

        $stmtPrecio = $conn->prepare("
            SELECT idprecio, precio
            FROM lista_precio
            WHERE idarticulo = ?
            ORDER BY fecha DESC
            LIMIT 1
        ");
        $stmtPrecio->bind_param("i", $idarticulo);
        $stmtPrecio->execute();
        $precioData = $stmtPrecio->get_result()->fetch_assoc();

        if (!$precioData) {
            echo json_encode(["success" => false, "error" => "No hay precio registrado para este artículo"]);
            exit;
        }

        $idprecio = $precioData['idprecio'];
        $precio = $precioData['precio'];
        $subtotal = $cantidad * $precio;

        // Insertar detalle
        $stmt = $conn->prepare("
            INSERT INTO detalle_venta (idventa, idarticulo, cantidad, subtotal, idprecio)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iiidi", $idventa, $idarticulo, $cantidad, $subtotal, $idprecio);
        $success = $stmt->execute();

        if ($success) {
            $updateStock = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
            $updateStock->bind_param("ii", $cantidad, $idarticulo);
            $updateStock->execute();

            // Actualizar total
            $conn->query("
                UPDATE ventas 
                SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_venta WHERE idventa = $idventa)
                WHERE idventa = $idventa
            ");
        }

        echo json_encode(["success" => $success]);
        break;

    case 'updateDetalle':
        $input = json_decode(file_get_contents('php://input'), true);
        $iddetalle = $input['iddetalle_venta'];
        $idventa = $input['idventa'];
        $nuevoArticulo = $input['idarticulo'];
        $nuevaCantidad = $input['cantidad'];

        // Obtener el detalle anterior
        $stmt = $conn->prepare("SELECT idarticulo, cantidad FROM detalle_venta WHERE iddetalle_venta = ?");
        $stmt->bind_param("i", $iddetalle);
        $stmt->execute();
        $old = $stmt->get_result()->fetch_assoc();

        if ($old) {
            $oldArticulo = $old['idarticulo'];
            $oldCantidad = $old['cantidad'];

            // Buscar el precio más reciente del nuevo artículo
            $stmtPrecio = $conn->prepare("
                SELECT idprecio, precio
                FROM lista_precio
                WHERE idarticulo = ?
                ORDER BY fecha DESC
                LIMIT 1
            ");
            $stmtPrecio->bind_param("i", $nuevoArticulo);
            $stmtPrecio->execute();
            $precioData = $stmtPrecio->get_result()->fetch_assoc();

            if (!$precioData) {
                echo json_encode(["success" => false, "error" => "No hay precio registrado para este artículo"]);
                exit;
            }

            $idprecio = $precioData['idprecio'];
            $precio = $precioData['precio'];
            $subtotal = $nuevaCantidad * $precio;

            // Ajuste de stock
            if ($oldArticulo == $nuevoArticulo) {
                $diferencia = $nuevaCantidad - $oldCantidad;
                $updateStock = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
                $updateStock->bind_param("ii", $diferencia, $nuevoArticulo);
                $updateStock->execute();
            } else {
                // Devolver stock al anterior y restar al nuevo
                $devolver = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
                $devolver->bind_param("ii", $oldCantidad, $oldArticulo);
                $devolver->execute();

                $restar = $conn->prepare("UPDATE articulos SET stock = stock - ? WHERE idarticulo = ?");
                $restar->bind_param("ii", $nuevaCantidad, $nuevoArticulo);
                $restar->execute();
            }

            // Actualizar detalle
            $update = $conn->prepare("
                UPDATE detalle_venta
                SET idarticulo=?, cantidad=?, subtotal=?, idprecio=?
                WHERE iddetalle_venta=?
            ");
            $update->bind_param("iidii", $nuevoArticulo, $nuevaCantidad, $subtotal, $idprecio, $iddetalle);
            $success = $update->execute();

            if ($success) {
                // Recalcular total
                $conn->query("
                    UPDATE ventas 
                    SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_venta WHERE idventa = $idventa)
                    WHERE idventa = $idventa
                ");
            }

            echo json_encode(["success" => $success]);
        } else {
            echo json_encode(["success" => false, "error" => "Detalle no encontrado"]);
        }
        break;

    case 'deleteDetalle':
        $iddetalle = $_GET['iddetalle_venta'];

        $stmt = $conn->prepare("SELECT idarticulo, cantidad, idventa FROM detalle_venta WHERE iddetalle_venta = ?");
        $stmt->bind_param("i", $iddetalle);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if ($row) {
            $idarticulo = $row['idarticulo'];
            $cantidad = $row['cantidad'];
            $idventa = $row['idventa'];

            $del = $conn->prepare("DELETE FROM detalle_venta WHERE iddetalle_venta = ?");
            $del->bind_param("i", $iddetalle);
            $success = $del->execute();

            if ($success) {
                $updateStock = $conn->prepare("UPDATE articulos SET stock = stock + ? WHERE idarticulo = ?");
                $updateStock->bind_param("ii", $cantidad, $idarticulo);
                $updateStock->execute();

                $conn->query("
                    UPDATE ventas 
                    SET total = (SELECT IFNULL(SUM(subtotal),0) FROM detalle_venta WHERE idventa = $idventa)
                    WHERE idventa = $idventa
                ");
            }

            echo json_encode(["success" => $success]);
        } else {
            echo json_encode(["success" => false, "error" => "Detalle no encontrado"]);
        }
        break;

    default:
        echo json_encode(["success" => false, "error" => "Acción no válida"]);
}
?>
