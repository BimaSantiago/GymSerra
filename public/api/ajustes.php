<?php
include "conexion.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
session_start();

$conn = ConcectarBd();
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error"   => "Error de conexión: " . $conn->connect_error
    ]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {

    // ============================================================
    // LISTAR AJUSTES (movimiento tipo Entrada/Salida)
    // ============================================================
    case 'list':
        $page  = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $dateStart = isset($_GET['dateStart']) ? trim($_GET['dateStart']) : '';
        $dateEnd   = isset($_GET['dateEnd']) ? trim($_GET['dateEnd']) : '';

        if ($page < 1) $page = 1;
        if ($limit < 1) $limit = 10;
        $offset = ($page - 1) * $limit;

        $where = "WHERE m.tipo IN ('Entrada','Salida')";
        $params = [];
        $types  = "";

        if ($dateStart !== "") {
            $where .= " AND DATE(m.fecha) >= ?";
            $params[] = $dateStart;
            $types   .= "s";
        }
        if ($dateEnd !== "") {
            $where .= " AND DATE(m.fecha) <= ?";
            $params[] = $dateEnd;
            $types   .= "s";
        }

        // Total
        $sqlTotal = "SELECT COUNT(*) AS total FROM movimiento m $where";
        $stmtTotal = $conn->prepare($sqlTotal);
        if ($stmtTotal === false) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar total: " . $conn->error
            ]);
            break;
        }
        if (!empty($params)) {
            $stmtTotal->bind_param($types, ...$params);
        }
        $stmtTotal->execute();
        $resTotal = $stmtTotal->get_result();
        $total = 0;
        if ($resTotal && $rowT = $resTotal->fetch_assoc()) {
            $total = (int)$rowT['total'];
        }
        $stmtTotal->close();

        // Lista
        $sql = "
            SELECT
              m.idmovimiento,
              m.fecha,
              m.comentario,
              m.tipo
            FROM movimiento m
            $where
            ORDER BY m.fecha DESC
            LIMIT ? OFFSET ?
        ";
        $typesList  = $types . "ii";
        $paramsList = $params;
        $paramsList[] = $limit;
        $paramsList[] = $offset;

        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar listado: " . $conn->error
            ]);
            break;
        }
        $stmt->bind_param($typesList, ...$paramsList);
        $stmt->execute();
        $result = $stmt->get_result();

        $ajustes = [];
        while ($row = $result->fetch_assoc()) {
            $ajustes[] = [
                "idajuste"   => (int)$row["idmovimiento"],
                "fecha"      => $row["fecha"],
                "comentario" => $row["comentario"],
                "tipo"       => strtolower($row["tipo"]), // "entrada" / "salida"
            ];
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "ajustes" => $ajustes,
            "total"   => $total,
            "page"    => $page,
            "limit"   => $limit
        ]);
        break;

    // ============================================================
    // DETALLE DE UN AJUSTE (movimiento + detalle_movimiento)
    // ============================================================
    case 'detalle':
        $idajuste = isset($_GET['idajuste']) ? (int)$_GET['idajuste'] : 0;
        if ($idajuste <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID de ajuste inválido"
            ]);
            break;
        }

        // Header
        $sqlInfo = "
            SELECT
              m.idmovimiento,
              m.fecha,
              m.comentario,
              m.tipo
            FROM movimiento m
            WHERE m.idmovimiento = ?
              AND m.tipo IN ('Entrada','Salida')
            LIMIT 1
        ";
        $stmtInfo = $conn->prepare($sqlInfo);
        if ($stmtInfo === false) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar cabecera: " . $conn->error
            ]);
            break;
        }
        $stmtInfo->bind_param("i", $idajuste);
        $stmtInfo->execute();
        $resInfo = $stmtInfo->get_result();
        $rowInfo = $resInfo->fetch_assoc();
        $stmtInfo->close();

        if (!$rowInfo) {
            echo json_encode([
                "success" => false,
                "error"   => "Ajuste no encontrado"
            ]);
            break;
        }

        $info = [
            "idajuste"   => (int)$rowInfo["idmovimiento"],
            "fecha"      => $rowInfo["fecha"],
            "comentario" => $rowInfo["comentario"],
            "tipo"       => strtolower($rowInfo["tipo"]), // entrada/salida
        ];

        // Detalles
        $sqlDet = "
            SELECT
              d.iddetalle_movimiento,
              d.idarticulo,
              a.nombre AS articulo,
              d.conteo,
              d.diferencia
            FROM detalle_movimiento d
            INNER JOIN articulos a ON a.idarticulo = d.idarticulo
            WHERE d.idmovimiento = ?
        ";
        $stmtDet = $conn->prepare($sqlDet);
        if ($stmtDet === false) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar detalles: " . $conn->error
            ]);
            break;
        }
        $stmtDet->bind_param("i", $idajuste);
        $stmtDet->execute();
        $resDet = $stmtDet->get_result();

        $detalles = [];
        while ($row = $resDet->fetch_assoc()) {
            $detalles[] = [
                "iddetalle"  => (int)$row["iddetalle_movimiento"],
                "idarticulo" => (int)$row["idarticulo"],
                "articulo"   => $row["articulo"],
                "conteo"     => (int)$row["conteo"],
                "diferencia" => (int)$row["diferencia"],
            ];
        }
        $stmtDet->close();

        echo json_encode([
            "success"  => true,
            "info"     => $info,
            "detalles" => $detalles
        ]);
        break;

    // ============================================================
    // GUARDAR AJUSTE COMPLETO (movimiento + detalle_movimiento)
    // ============================================================
    case 'save':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            echo json_encode([
                "success" => false,
                "error"   => "Datos inválidos"
            ]);
            break;
        }

        $tipo       = isset($data["tipo"]) ? strtolower(trim($data["tipo"])) : "";
        $comentario = isset($data["comentario"]) ? trim($data["comentario"]) : "";
        $detalles   = isset($data["detalles"]) && is_array($data["detalles"]) ? $data["detalles"] : [];

        if (!in_array($tipo, ['entrada', 'salida'], true)) {
            echo json_encode([
                "success" => false,
                "error"   => "Tipo de ajuste inválido (entrada/salida)"
            ]);
            break;
        }
        if ($comentario === "") {
            echo json_encode([
                "success" => false,
                "error"   => "La justificación es obligatoria"
            ]);
            break;
        }
        if (count($detalles) === 0) {
            echo json_encode([
                "success" => false,
                "error"   => "Debe agregar al menos un artículo al ajuste"
            ]);
            break;
        }

        $tipoBD = ($tipo === 'entrada') ? 'Entrada' : 'Salida';

        // 🔹 Ya NO pedimos idcliente del frontend
        // Debes tener un cliente genérico para ajustes (ej. idcliente = 1)
        $idcliente   = 1; // Cliente genérico "Ajuste"
        $idcorte     = 1; // Corte genérico o el actual
        $idproveedor = 1; // Proveedor genérico si aplica
        $iduser      = isset($_SESSION["iduser"]) ? (int)$_SESSION["iduser"] : 1;
        $total       = 0.0; // No se usa en ajustes de stock, pero la columna es NOT NULL

        $conn->begin_transaction();

        try {
            // Insertar movimiento (cabecera)
            $sqlMov = "
                INSERT INTO movimiento
                    (comentario, fecha, total, iduser, tipo)
                VALUES (?, NOW(), ?, ?, ?)
            ";
            $stmtMov = $conn->prepare($sqlMov);
            if ($stmtMov === false) {
                throw new Exception("Error al preparar movimiento: " . $conn->error);
            }
            $stmtMov->bind_param(
                "sdis",
                $comentario,
                $total,
                $iduser,
                $tipoBD
            );
            if (!$stmtMov->execute()) {
                throw new Exception("Error al insertar movimiento: " . $stmtMov->error);
            }
            $idmovimiento = (int)$conn->insert_id;
            $stmtMov->close();

            // Insertar detalles y actualizar stock
            $sqlDet = "
                INSERT INTO detalle_movimiento
                    (idmovimiento, idarticulo, conteo, diferencia, subtotal, cantidad, idcosto, idprecio)
                VALUES (?, ?, ?, ?, 0, 0, NULL, NULL)
            ";
            $stmtDet = $conn->prepare($sqlDet);
            if ($stmtDet === false) {
                throw new Exception("Error al preparar detalle: " . $conn->error);
            }

            $sqlUpdateStock = "UPDATE articulos SET stock = ? WHERE idarticulo = ?";
            $stmtStock = $conn->prepare($sqlUpdateStock);
            if ($stmtStock === false) {
                throw new Exception("Error al preparar actualización de stock: " . $conn->error);
            }

            foreach ($detalles as $d) {
                $idarticulo = isset($d["idarticulo"]) ? (int)$d["idarticulo"] : 0;
                $conteo     = isset($d["conteo"]) ? (int)$d["conteo"] : 0;
                $dif        = isset($d["diferencia"]) ? (int)$d["diferencia"] : 0;

                if ($idarticulo <= 0 || $conteo < 0) {
                    throw new Exception("Datos de detalle inválidos");
                }

                // Insertar detalle
                $stmtDet->bind_param(
                    "iiii",
                    $idmovimiento,
                    $idarticulo,
                    $conteo,
                    $dif
                );
                if (!$stmtDet->execute()) {
                    throw new Exception("Error al insertar detalle: " . $stmtDet->error);
                }

                // Actualizar stock con el conteo físico final
                $stmtStock->bind_param("ii", $conteo, $idarticulo);
                if (!$stmtStock->execute()) {
                    throw new Exception("Error al actualizar stock: " . $stmtStock->error);
                }
            }

            $stmtDet->close();
            $stmtStock->close();

            $conn->commit();

            echo json_encode([
                "success"  => true,
                "idajuste" => $idmovimiento,
                "msg"      => "Ajuste guardado correctamente"
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                "success" => false,
                "error"   => $e->getMessage()
            ]);
        }

        break;

    default:
        echo json_encode([
            "success" => false,
            "error"   => "Acción no válida"
        ]);
        break;
}

$conn->close();
?>
