<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
include 'conexion.php';
$conn=ConcectarBd();
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {

    case 'list':
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $offset = ($page - 1) * $limit;

        $where = $search ? "WHERE p.nombre LIKE '%$search%' OR p.RFC LIKE '%$search%'" : '';
        $query = "SELECT * FROM proveedores p $where ORDER BY p.idprovedor ASC LIMIT $limit OFFSET $offset";
        $result = $conn->query($query);

        $proveedores = array();
        while ($row = $result->fetch_assoc()) {
            $proveedores[] = $row;
        }

        $countQuery = "SELECT COUNT(*) AS total FROM proveedores p $where";
        $countResult = $conn->query($countQuery);
        $total = $countResult->fetch_assoc()['total'];

        echo json_encode(['proveedores' => $proveedores, 'total' => $total]);
        break;

    case 'get':
        $id = intval($_GET['idprovedor'] ?? 0);
        $stmt = $conn->prepare("SELECT * FROM proveedores WHERE idprovedor = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        if ($res) {
            echo json_encode(['success' => true, 'proveedor' => $res]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Proveedor no encontrado']);
        }
        break;

    case 'create':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("INSERT INTO proveedores (nombre, RFC, dirección, teléfono, correo, estado) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $data['nombre'], $data['RFC'], $data['dirección'], $data['teléfono'], $data['correo'], $data['estado']);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;

    case 'update':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("UPDATE proveedores SET nombre=?, RFC=?, dirección=?, teléfono=?, correo=?, estado=? WHERE idprovedor=?");
        $stmt->bind_param("ssssssi", $data['nombre'], $data['RFC'], $data['dirección'], $data['teléfono'], $data['correo'], $data['estado'], $data['idprovedor']);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;

    case 'delete':
        $id = intval($_GET['idprovedor'] ?? 0);
        $stmt = $conn->prepare("DELETE FROM proveedores WHERE idprovedor=?");
        $stmt->bind_param("i", $id);
        $success = $stmt->execute();
        echo json_encode(['success' => $success]);
        break;

    case 'purchases':
    $idprovedor = intval($_GET['idprovedor'] ?? 0);
    $stmt = $conn->prepare("SELECT idcompra, fecha, total FROM compra WHERE idprovedor = ? ORDER BY fecha DESC");
    $stmt->bind_param("i", $idprovedor);
    $stmt->execute();
    $result = $stmt->get_result();
    $compras = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'compras' => $compras]);
    break;

    case 'purchase_detail':
    $idcompra = intval($_GET['idcompra'] ?? 0);

    $query = "
        SELECT 
            d.iddetalle_compra,
            a.nombre AS articulo,
            d.cantidad,
            d.subtotal,
            d.idcosto,
            d.idprecio
        FROM detalle_compra d
        INNER JOIN articulos a ON d.idarticulo = a.idarticulo
        WHERE d.idcompra = ?
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idcompra);
    $stmt->execute();
    $result = $stmt->get_result();

    $detalles = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'detalles' => $detalles]);
    break;


    default:
        echo json_encode(['error' => 'Acción no válida']);
}
?>
