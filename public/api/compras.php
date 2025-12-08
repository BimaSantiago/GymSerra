<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

include 'conexion.php';
$conn = ConcectarBd();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';

function getFirstId($conn, $table, $column)
{
    $sql = "SELECT $column AS id FROM $table ORDER BY $column ASC LIMIT 1";
    $res = $conn->query($sql);
    if ($res && $row = $res->fetch_assoc()) {
        return intval($row['id']);
    }
    return 1;
}

switch ($action) {

    // ======================================================
    // LISTAR COMPRAS (movimiento.tipo = 'Compra')
    // ======================================================
    case 'list':
        $page   = isset($_GET['page']) ? max(intval($_GET['page']), 1) : 1;
        $limit  = isset($_GET['limit']) ? max(intval($_GET['limit']), 1) : 10;
        $search = trim($_GET['search'] ?? '');
        $offset = ($page - 1) * $limit;

        $query = "
            SELECT 
                m.idmovimiento AS idcompra,
                DATE_FORMAT(m.fecha, '%Y-%m-%d') AS fecha,
                m.total,
                p.nombre AS proveedor
            FROM movimiento m
            INNER JOIN proveedores p ON m.idproveedor = p.idproveedor
            WHERE m.tipo = 'Compra'
              AND (
                    p.nombre LIKE ?
                    OR DATE(m.fecha) LIKE ?
                  )
            ORDER BY m.idmovimiento DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $conn->prepare($query);
        $like = "%$search%";
        $stmt->bind_param("ssii", $like, $like, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();

        $compras = [];
        while ($row = $result->fetch_assoc()) {
            $compras[] = [
                'idcompra'  => intval($row['idcompra']),
                'fecha'     => $row['fecha'],
                'total'     => floatval($row['total']),
                'proveedor' => $row['proveedor'],
            ];
        }

        $stmtTotal = $conn->prepare("
            SELECT COUNT(*) AS total
            FROM movimiento m
            INNER JOIN proveedores p ON m.idproveedor = p.idproveedor
            WHERE m.tipo = 'Compra'
              AND (
                    p.nombre LIKE ?
                    OR DATE(m.fecha) LIKE ?
                  )
        ");
        $stmtTotal->bind_param("ss", $like, $like);
        $stmtTotal->execute();
        $resTotal = $stmtTotal->get_result()->fetch_assoc();
        $total = intval($resTotal['total'] ?? 0);

        echo json_encode([
            'success' => true,
            'compras' => $compras,
            'total'   => $total
        ]);
        break;

    // ======================================================
    // DETALLE DE UNA COMPRA
    // ======================================================
    case 'detalle':
        $idcompra = isset($_GET['idcompra']) ? intval($_GET['idcompra']) : 0;
        if ($idcompra <= 0) {
            echo json_encode(['success' => false, 'error' => 'ID de compra inválido']);
            break;
        }

        // Encabezado
        $stmtInfo = $conn->prepare("
            SELECT 
                m.idmovimiento AS idcompra,
                m.fecha,
                m.total,
                p.nombre AS proveedor
            FROM movimiento m
            INNER JOIN proveedores p ON p.idproveedor = m.idproveedor
            WHERE m.idmovimiento = ? AND m.tipo = 'Compra'
            LIMIT 1
        ");
        $stmtInfo->bind_param("i", $idcompra);
        $stmtInfo->execute();
        $resInfo = $stmtInfo->get_result();
        $info = $resInfo->fetch_assoc();

        if (!$info) {
            echo json_encode(['success' => false, 'error' => 'Compra no encontrada']);
            break;
        }

        $infoOut = [
            'idcompra'  => intval($info['idcompra']),
            'fecha'     => $info['fecha'],
            'total'     => floatval($info['total']),
            'proveedor' => $info['proveedor']
        ];

        // Detalles
        $stmtDet = $conn->prepare("
            SELECT
                d.iddetalle_movimiento AS iddetalle_compra,
                d.idarticulo,
                a.nombre AS articulo,
                d.cantidad,
                d.subtotal,
                lc.precio AS costo,
                lp.precio AS precio
            FROM detalle_movimiento d
            INNER JOIN articulos a ON a.idarticulo = d.idarticulo
            LEFT JOIN lista_costo  lc ON lc.idcosto  = d.idcosto
            LEFT JOIN lista_precio lp ON lp.idprecio = d.idprecio
            WHERE d.idmovimiento = ?
            ORDER BY d.iddetalle_movimiento ASC
        ");
        $stmtDet->bind_param("i", $idcompra);
        $stmtDet->execute();
        $resDet = $stmtDet->get_result();

        $detalles = [];
        $totalCalc = 0.0;
        while ($row = $resDet->fetch_assoc()) {
            $sub = floatval($row['subtotal']);
            $totalCalc += $sub;

            $detalles[] = [
                'iddetalle_compra' => intval($row['iddetalle_compra']),
                'idarticulo'       => intval($row['idarticulo']),
                'articulo'         => $row['articulo'],
                'cantidad'         => floatval($row['cantidad']),
                'subtotal'         => $sub,
                'costo'            => $row['costo'] !== null ? floatval($row['costo']) : null,
                'precio'           => $row['precio'] !== null ? floatval($row['precio']) : null,
            ];
        }

        echo json_encode([
            'success'  => true,
            'info'     => $infoOut,
            'detalles' => $detalles,
            'total'    => $totalCalc
        ]);
        break;

    // ======================================================
    // GUARDAR COMPRA (para el botón "Guardar compra")
    // ======================================================
    case 'save':
        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            echo json_encode(['success' => false, 'error' => 'JSON inválido']);
            break;
        }

        $idproveedor = isset($input['idproveedor']) ? intval($input['idproveedor']) : 0;
        $detalles    = isset($input['detalles']) && is_array($input['detalles']) ? $input['detalles'] : [];

        if ($idproveedor <= 0) {
            echo json_encode(['success' => false, 'error' => 'Debe seleccionar un proveedor']);
            break;
        }
        if (count($detalles) === 0) {
            echo json_encode(['success' => false, 'error' => 'Debe agregar al menos un artículo']);
            break;
        }

        // IDs por defecto (ajusta si ya manejas user/cliente/corte reales)
        $iduser    = getFirstId($conn, 'users', 'iduser');
        $idcliente = getFirstId($conn, 'cliente', 'idcliente');
        $idcorte   = getFirstId($conn, 'corte_caja', 'idcorte');

        try {
            $conn->begin_transaction();

            // 1) Encabezado en movimiento
            $stmtMov = $conn->prepare("
                INSERT INTO movimiento (comentario, fecha, iduser, idproveedor, tipo)
                VALUES ('Compra a proveedor', NOW(), ?, ?, 'Compra')
            ");
            $stmtMov->bind_param("ii", $iduser, $idproveedor);
            $stmtMov->execute();
            $idmovimiento = $conn->insert_id;

            // 2) Detalles
            $total = 0.0;

            foreach ($detalles as $d) {
                if (!isset($d['idarticulo']) || !isset($d['cantidad'])) {
                    throw new Exception("Detalle incompleto (idarticulo/cantidad).");
                }

                $idarticulo = intval($d['idarticulo']);
                $cantidad   = floatval($d['cantidad']);

                if ($idarticulo <= 0 || $cantidad <= 0) {
                    throw new Exception("Detalle inválido (idarticulo/cantidad <= 0).");
                }

                // Precios opcionales
                $precioCosto = null;
                if (isset($d['precioCosto']) && $d['precioCosto'] !== '' && $d['precioCosto'] !== null) {
                    $precioCosto = floatval($d['precioCosto']);
                    if ($precioCosto <= 0) {
                        $precioCosto = null;
                    }
                }

                $precioVenta = null;
                if (isset($d['precioVenta']) && $d['precioVenta'] !== '' && $d['precioVenta'] !== null) {
                    $precioVenta = floatval($d['precioVenta']);
                    if ($precioVenta <= 0) {
                        $precioVenta = null;
                    }
                }

                // Subtotal basado en costo o precio (si existen)
                $baseSubtotal = 0.0;
                if ($precioCosto !== null) {
                    $baseSubtotal = $precioCosto;
                } elseif ($precioVenta !== null) {
                    $baseSubtotal = $precioVenta;
                }
                $subtotal = $cantidad * $baseSubtotal;
                $total += $subtotal;

                // Insertar en lista_costo si viene precioCosto
                $idcosto = null;
                if ($precioCosto !== null) {
                    $stmtCosto = $conn->prepare("
                        INSERT INTO lista_costo (idarticulo, precio)
                        VALUES (?, ?)
                    ");
                    $stmtCosto->bind_param("id", $idarticulo, $precioCosto);
                    $stmtCosto->execute();
                    $idcosto = $stmtCosto->insert_id;
                }

                // Insertar en lista_precio si viene precioVenta
                $idprecio = null;
                if ($precioVenta !== null) {
                    $stmtPrecio = $conn->prepare("
                        INSERT INTO lista_precio (idarticulo, precio)
                        VALUES (?, ?)
                    ");
                    $stmtPrecio->bind_param("id", $idarticulo, $precioVenta);
                    $stmtPrecio->execute();
                    $idprecio = $stmtPrecio->insert_id;
                }

                // detalle_movimiento
                $stmtDet = $conn->prepare("
                    INSERT INTO detalle_movimiento (idmovimiento, idarticulo, cantidad, subtotal, idcosto, idprecio)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmtDet->bind_param(
                    "iiidii",
                    $idmovimiento,
                    $idarticulo,
                    $cantidad,
                    $subtotal,
                    $idcosto,
                    $idprecio
                );
                $stmtDet->execute();

                // Actualizar stock
                $stmtStock = $conn->prepare("
                    UPDATE articulos 
                    SET stock = stock + ? 
                    WHERE idarticulo = ?
                ");
                $stmtStock->bind_param("di", $cantidad, $idarticulo);
                $stmtStock->execute();
            }

            // 3) Actualizar total
            $stmtUpd = $conn->prepare("
                UPDATE movimiento
                SET total = ?
                WHERE idmovimiento = ?
            ");
            $stmtUpd->bind_param("di", $total, $idmovimiento);
            $stmtUpd->execute();

            $conn->commit();

            echo json_encode([
                'success'  => true,
                'idcompra' => $idmovimiento
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                'success' => false,
                'error'   => 'Error al guardar compra: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        break;
}

$conn->close();
?>
