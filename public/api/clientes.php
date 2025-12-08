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
        "error" => "Error de conexión: " . $conn->connect_error
    ]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {

    // ============================================================
    // LISTAR CLIENTES
    // ============================================================
    case 'list':
        $page  = isset($_GET['page'])  ? (int)$_GET['page']  : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        if ($page < 1) $page = 1;
        if ($limit < 1) $limit = 10;
        $offset = ($page - 1) * $limit;

        $where = '';
        if ($search !== '') {
            $searchEsc = $conn->real_escape_string($search);
            $where = "
                WHERE
                    c.curp LIKE '%$searchEsc%' OR
                    c.nombre_completo LIKE '%$searchEsc%'
            ";
        }

        $sqlTotal = "
            SELECT COUNT(*) AS total
            FROM cliente c
            $where
        ";
        $resTotal = $conn->query($sqlTotal);
        $total = 0;
        if ($resTotal && $rowT = $resTotal->fetch_assoc()) {
            $total = (int)$rowT['total'];
        }

        $sql = "
            SELECT
              c.idcliente,
              c.curp,
              c.nombre_completo,
              c.f_nacimiento,
              c.estado,
              c.fecha_registro,
              c.f_ultima_compra
            FROM cliente c
            $where
            ORDER BY c.fecha_registro DESC
            LIMIT $limit OFFSET $offset
        ";

        $result = $conn->query($sql);
        if (!$result) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al obtener clientes: " . $conn->error
            ]);
            break;
        }

        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            $clientes[] = [
                "idcliente"       => (int)$row["idcliente"],
                "curp"            => $row["curp"],
                "nombre_completo" => $row["nombre_completo"],
                "f_nacimiento"    => $row["f_nacimiento"],
                "estado"          => $row["estado"],
                "fecha_registro"  => $row["fecha_registro"],
                "f_ultima_compra" => $row["f_ultima_compra"],
            ];
        }

        echo json_encode([
            "success"  => true,
            "clientes" => $clientes,
            "total"    => $total,
            "page"     => $page,
            "limit"    => $limit
        ]);
        break;

    // ============================================================
    // OBTENER UN CLIENTE
    // ============================================================
    case 'get':
        $idcliente = isset($_GET['idcliente']) ? (int)$_GET['idcliente'] : 0;
        if ($idcliente <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID de cliente inválido"
            ]);
            break;
        }

        $sql = "
            SELECT
              idcliente,
              curp,
              nombre_completo,
              f_nacimiento,
              estado,
              fecha_registro,
              f_ultima_compra
            FROM cliente
            WHERE idcliente = ?
            LIMIT 1
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar consulta: " . $conn->error
            ]);
            break;
        }
        $stmt->bind_param("i", $idcliente);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($row = $res->fetch_assoc()) {
            echo json_encode([
                "success" => true,
                "cliente" => [
                    "idcliente"       => (int)$row["idcliente"],
                    "curp"            => $row["curp"],
                    "nombre_completo" => $row["nombre_completo"],
                    "f_nacimiento"    => $row["f_nacimiento"],
                    "estado"          => $row["estado"],
                    "fecha_registro"  => $row["fecha_registro"],
                    "f_ultima_compra" => $row["f_ultima_compra"],
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Cliente no encontrado"
            ]);
        }
        $stmt->close();
        break;

    // ============================================================
    // CREAR CLIENTE
    // ============================================================
    case 'create':
        $data = json_decode(file_get_contents("php://input"), true) ?? [];

        $curp            = isset($data["curp"]) ? trim($data["curp"]) : "";
        $nombre_completo = isset($data["nombre_completo"]) ? trim($data["nombre_completo"]) : "";
        $f_nacimiento    = isset($data["f_nacimiento"]) ? trim($data["f_nacimiento"]) : "";
        $estado          = isset($data["estado"]) ? trim($data["estado"]) : "Activo";

        if ($curp === "" || $nombre_completo === "" || $f_nacimiento === "") {
            echo json_encode([
                "success" => false,
                "error"   => "CURP, nombre completo y fecha de nacimiento son obligatorios"
            ]);
            break;
        }

        // Validar duplicado por CURP o por (nombre_completo + f_nacimiento)
        $sqlCheck = "
            SELECT COUNT(*) AS total
            FROM cliente
            WHERE curp = ? OR (nombre_completo = ? AND f_nacimiento = ?)
        ";
        $stmtCheck = $conn->prepare($sqlCheck);
        if (!$stmtCheck) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar validación: " . $conn->error
            ]);
            break;
        }
        $stmtCheck->bind_param("sss", $curp, $nombre_completo, $f_nacimiento);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        $rowCheck = $resCheck->fetch_assoc();
        $stmtCheck->close();

        if ((int)$rowCheck["total"] > 0) {
            echo json_encode([
                "success" => false,
                "error"   => "Ya existe un cliente con la misma CURP o con el mismo nombre y fecha de nacimiento"
            ]);
            break;
        }

        $sql = "
            INSERT INTO cliente
              (curp, nombre_completo, f_nacimiento, estado)
            VALUES (?,?,?,?)
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar inserción: " . $conn->error
            ]);
            break;
        }
        $stmt->bind_param("ssss", $curp, $nombre_completo, $f_nacimiento, $estado);

        if ($stmt->execute()) {
            echo json_encode([
                "success"   => true,
                "idcliente" => (int)$conn->insert_id,
                "msg"       => "Cliente creado correctamente"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Error al crear cliente: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    // ============================================================
    // ACTUALIZAR CLIENTE
    // ============================================================
    case 'update':
        $data = json_decode(file_get_contents("php://input"), true) ?? [];

        $idcliente       = isset($data["idcliente"]) ? (int)$data["idcliente"] : 0;
        $curp            = isset($data["curp"]) ? trim($data["curp"]) : "";
        $nombre_completo = isset($data["nombre_completo"]) ? trim($data["nombre_completo"]) : "";
        $f_nacimiento    = isset($data["f_nacimiento"]) ? trim($data["f_nacimiento"]) : "";
        $estado          = isset($data["estado"]) ? trim($data["estado"]) : "Activo";

        if ($idcliente <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID de cliente inválido"
            ]);
            break;
        }

        if ($curp === "" || $nombre_completo === "" || $f_nacimiento === "") {
            echo json_encode([
                "success" => false,
                "error"   => "CURP, nombre completo y fecha de nacimiento son obligatorios"
            ]);
            break;
        }

        // Validar duplicado (otro cliente con misma CURP o mismo nombre + fecha)
        $sqlCheck = "
            SELECT COUNT(*) AS total
            FROM cliente
            WHERE (curp = ? OR (nombre_completo = ? AND f_nacimiento = ?))
              AND idcliente <> ?
        ";
        $stmtCheck = $conn->prepare($sqlCheck);
        if (!$stmtCheck) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar validación: " . $conn->error
            ]);
            break;
        }
        $stmtCheck->bind_param("sssi", $curp, $nombre_completo, $f_nacimiento, $idcliente);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        $rowCheck = $resCheck->fetch_assoc();
        $stmtCheck->close();

        if ((int)$rowCheck["total"] > 0) {
            echo json_encode([
                "success" => false,
                "error"   => "Ya existe otro cliente con la misma CURP o con el mismo nombre y fecha de nacimiento"
            ]);
            break;
        }

        $sql = "
            UPDATE cliente
            SET
              curp            = ?,
              nombre_completo = ?,
              f_nacimiento    = ?,
              estado          = ?
            WHERE idcliente   = ?
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar actualización: " . $conn->error
            ]);
            break;
        }
        $stmt->bind_param("ssssi", $curp, $nombre_completo, $f_nacimiento, $estado, $idcliente);

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "msg"     => "Cliente actualizado correctamente"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Error al actualizar cliente: " . $stmt->error
            ]);
        }
        $stmt->close();
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
