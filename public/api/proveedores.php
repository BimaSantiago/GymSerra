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
        $page  = isset($_GET['page'])  ? max(1, (int)$_GET['page'])  : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        $whereSql = '';
        $params = [];
        $types  = '';

        if ($search !== '') {
            $whereSql = "WHERE (p.nombre LIKE ? OR p.RFC LIKE ? OR p.correo LIKE ? OR p.nombre_vendedor LIKE ?)";
            $like = '%' . $search . '%';
            $params = [$like, $like, $like, $like];
            $types  = 'ssss';
        }

        // Total
        $sqlCount = "SELECT COUNT(*) AS total FROM proveedores p $whereSql";
        $stmtCount = $conn->prepare($sqlCount);
        if ($stmtCount && $whereSql !== '') {
            $stmtCount->bind_param($types, ...$params);
        }
        if (!$stmtCount || !$stmtCount->execute()) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al contar proveedores: ' . $conn->error,
            ]);
            exit;
        }
        $resultCount = $stmtCount->get_result();
        $rowCount = $resultCount->fetch_assoc();
        $total = (int)$rowCount['total'];
        $stmtCount->close();

        // Lista
        $sql = "
            SELECT
              p.idproveedor,
              p.nombre,
              p.RFC,
              p.codigo_postal,
              p.calle,
              p.localidad,
              p.municipio,
              p.telefono,
              p.correo,
              p.estado,
              p.nombre_vendedor,
              p.telefono_vendedor,
              p.correo_vendedor
            FROM proveedores p
            $whereSql
            ORDER BY p.nombre ASC
            LIMIT ? OFFSET ?
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            exit;
        }

        if ($whereSql !== '') {
            // añadimos tipos para limit y offset
            $typesPag = $types . 'ii';
            $paramsPag = array_merge($params, [$limit, $offset]);
            $stmt->bind_param($typesPag, ...$paramsPag);
        } else {
            $stmt->bind_param('ii', $limit, $offset);
        }

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al listar proveedores: ' . $stmt->error,
            ]);
            $stmt->close();
            exit;
        }

        $result = $stmt->get_result();
        $proveedores = [];
        while ($row = $result->fetch_assoc()) {
            $proveedores[] = [
                'idproveedor'       => (int)$row['idproveedor'],
                'nombre'            => $row['nombre'],
                'RFC'               => $row['RFC'],
                'codigo_postal'     => $row['codigo_postal'],
                'calle'             => $row['calle'],
                'localidad'         => $row['localidad'],
                'municipio'         => $row['municipio'],
                'telefono'          => $row['telefono'],
                'correo'            => $row['correo'],
                'estado'            => $row['estado'],
                'nombre_vendedor'   => $row['nombre_vendedor'],
                'telefono_vendedor' => $row['telefono_vendedor'],
                'correo_vendedor'   => $row['correo_vendedor'],
            ];
        }
        $stmt->close();

        echo json_encode([
            'success'     => true,
            'proveedores' => $proveedores,
            'total'       => $total,
        ]);
        break;

    case 'get':
        $idproveedor = isset($_GET['idproveedor']) ? (int)$_GET['idproveedor'] : 0;
        if ($idproveedor <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de proveedor inválido',
            ]);
            break;
        }

        $sql = "
            SELECT
              idproveedor,
              nombre,
              RFC,
              codigo_postal,
              calle,
              localidad,
              municipio,
              telefono,
              correo,
              estado,
              nombre_vendedor,
              telefono_vendedor,
              correo_vendedor
            FROM proveedores
            WHERE idproveedor = ?
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }
        $stmt->bind_param('i', $idproveedor);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success'   => true,
                'proveedor' => [
                    'idproveedor'       => (int)$row['idproveedor'],
                    'nombre'            => $row['nombre'],
                    'RFC'               => $row['RFC'],
                    'codigo_postal'     => $row['codigo_postal'],
                    'calle'             => $row['calle'],
                    'localidad'         => $row['localidad'],
                    'municipio'         => $row['municipio'],
                    'telefono'          => $row['telefono'],
                    'correo'            => $row['correo'],
                    'estado'            => $row['estado'],
                    'nombre_vendedor'   => $row['nombre_vendedor'],
                    'telefono_vendedor' => $row['telefono_vendedor'],
                    'correo_vendedor'   => $row['correo_vendedor'],
                ],
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Proveedor no encontrado',
            ]);
        }

        $stmt->close();
        break;

    case 'create':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $nombre            = trim($data['nombre']            ?? '');
        $RFC               = trim($data['RFC']               ?? '');
        $codigo_postal     = trim($data['codigo_postal']     ?? '');
        $calle             = trim($data['calle']             ?? '');
        $localidad         = trim($data['localidad']         ?? '');
        $municipio         = trim($data['municipio']         ?? '');
        $telefono          = trim($data['telefono']          ?? '');
        $correo            = trim($data['correo']            ?? '');
        $estado            = trim($data['estado']            ?? 'Activo');
        $nombre_vendedor   = trim($data['nombre_vendedor']   ?? '');
        $telefono_vendedor = trim($data['telefono_vendedor'] ?? '');
        $correo_vendedor   = trim($data['correo_vendedor']   ?? '');

        if (
            $nombre === '' ||
            $RFC === '' ||
            $calle === '' ||
            $localidad === '' ||
            $municipio === '' ||
            $telefono === '' ||
            $correo === '' ||
            $nombre_vendedor === '' ||
            $telefono_vendedor === '' ||
            $correo_vendedor === ''
        ) {
            echo json_encode([
                'success' => false,
                'error'   => 'Faltan datos obligatorios del proveedor',
            ]);
            break;
        }

        // Validar duplicados por RFC o nombre
        $sqlCheck = "
            SELECT COUNT(*) AS total
            FROM proveedores
            WHERE RFC = ? OR nombre = ?
        ";
        $stmtCheck = $conn->prepare($sqlCheck);
        if (!$stmtCheck) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar validación: ' . $conn->error,
            ]);
            break;
        }
        $stmtCheck->bind_param('ss', $RFC, $nombre);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        $rowCheck = $resCheck->fetch_assoc();
        $stmtCheck->close();

        if ((int)$rowCheck['total'] > 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'Ya existe un proveedor con el mismo RFC o nombre',
            ]);
            break;
        }

        $sql = "
            INSERT INTO proveedores
              (nombre, RFC, codigo_postal, calle, localidad, municipio,
               telefono, correo, estado,
               nombre_vendedor, telefono_vendedor, correo_vendedor)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar inserción: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            'ssssssssssss',
            $nombre,
            $RFC,
            $codigo_postal,
            $calle,
            $localidad,
            $municipio,
            $telefono,
            $correo,
            $estado,
            $nombre_vendedor,
            $telefono_vendedor,
            $correo_vendedor
        );

        if ($stmt->execute()) {
            echo json_encode([
                'success'      => true,
                'idproveedor'  => (int)$conn->insert_id,
                'message'      => 'Proveedor creado correctamente',
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al crear proveedor: ' . $stmt->error,
            ]);
        }

        $stmt->close();
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $idproveedor       = (int)($data['idproveedor']      ?? 0);
        $nombre            = trim($data['nombre']            ?? '');
        $RFC               = trim($data['RFC']               ?? '');
        $codigo_postal     = trim($data['codigo_postal']     ?? '');
        $calle             = trim($data['calle']             ?? '');
        $localidad         = trim($data['localidad']         ?? '');
        $municipio         = trim($data['municipio']         ?? '');
        $telefono          = trim($data['telefono']          ?? '');
        $correo            = trim($data['correo']            ?? '');
        $estado            = trim($data['estado']            ?? 'Activo');
        $nombre_vendedor   = trim($data['nombre_vendedor']   ?? '');
        $telefono_vendedor = trim($data['telefono_vendedor'] ?? '');
        $correo_vendedor   = trim($data['correo_vendedor']   ?? '');

        if ($idproveedor <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de proveedor inválido',
            ]);
            break;
        }

        if (
            $nombre === '' ||
            $RFC === '' ||
            $calle === '' ||
            $localidad === '' ||
            $municipio === '' ||
            $telefono === '' ||
            $correo === '' ||
            $nombre_vendedor === '' ||
            $telefono_vendedor === '' ||
            $correo_vendedor === ''
        ) {
            echo json_encode([
                'success' => false,
                'error'   => 'Faltan datos obligatorios del proveedor',
            ]);
            break;
        }

        // Validar duplicados (otro proveedor con mismo RFC o nombre)
        $sqlCheck = "
            SELECT COUNT(*) AS total
            FROM proveedores
            WHERE (RFC = ? OR nombre = ?) AND idproveedor <> ?
        ";
        $stmtCheck = $conn->prepare($sqlCheck);
        if (!$stmtCheck) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar validación: ' . $conn->error,
            ]);
            break;
        }
        $stmtCheck->bind_param('ssi', $RFC, $nombre, $idproveedor);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        $rowCheck = $resCheck->fetch_assoc();
        $stmtCheck->close();

        if ((int)$rowCheck['total'] > 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'Ya existe otro proveedor con el mismo RFC o nombre',
            ]);
            break;
        }

        $sql = "
            UPDATE proveedores
            SET
              nombre            = ?,
              RFC               = ?,
              codigo_postal     = ?,
              calle             = ?,
              localidad         = ?,
              municipio         = ?,
              telefono          = ?,
              correo            = ?,
              estado            = ?,
              nombre_vendedor   = ?,
              telefono_vendedor = ?,
              correo_vendedor   = ?
            WHERE idproveedor = ?
            LIMIT 1
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar actualización: ' . $conn->error,
            ]);
            break;
        }

        $stmt->bind_param(
            'ssssssssssssi',
            $nombre,
            $RFC,
            $codigo_postal,
            $calle,
            $localidad,
            $municipio,
            $telefono,
            $correo,
            $estado,
            $nombre_vendedor,
            $telefono_vendedor,
            $correo_vendedor,
            $idproveedor
        );

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Proveedor actualizado correctamente',
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al actualizar proveedor: ' . $stmt->error,
            ]);
        }

        $stmt->close();
        break;

    case 'purchases':
        $idproveedor = isset($_GET['idproveedor']) ? (int)$_GET['idproveedor'] : 0;
        if ($idproveedor <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de proveedor inválido',
            ]);
            break;
        }

        $sql = "
            SELECT
              m.idmovimiento AS idcompra,
              m.fecha        AS fecha,
              m.total        AS total
            FROM movimiento m
            WHERE m.idproveedor = ?
              AND m.tipo = 'Compra'
            ORDER BY m.fecha DESC
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }
        $stmt->bind_param('i', $idproveedor);
        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al obtener compras: ' . $stmt->error,
            ]);
            $stmt->close();
            break;
        }

        $result = $stmt->get_result();
        $compras = [];
        while ($row = $result->fetch_assoc()) {
            $compras[] = [
                'idcompra' => (int)$row['idcompra'],
                'fecha'    => $row['fecha'],
                'total'    => (float)$row['total'],
            ];
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'compras' => $compras,
        ]);
        break;

    case 'purchase_detail':
        $idcompra = isset($_GET['idcompra']) ? (int)$_GET['idcompra'] : 0;
        if ($idcompra <= 0) {
            echo json_encode([
                'success' => false,
                'error'   => 'ID de compra inválido',
            ]);
            break;
        }

        $sql = "
            SELECT
              d.iddetalle_movimiento AS iddetalle_compra,
              a.nombre               AS articulo,
              d.cantidad             AS cantidad,
              d.subtotal             AS subtotal,
              d.idcosto              AS idcosto,
              d.idprecio             AS idprecio
            FROM detalle_movimiento d
            INNER JOIN articulos a ON a.idarticulo = d.idarticulo
            WHERE d.idmovimiento = ?
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al preparar consulta: ' . $conn->error,
            ]);
            break;
        }
        $stmt->bind_param('i', $idcompra);
        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'error'   => 'Error al obtener detalle de compra: ' . $stmt->error,
            ]);
            $stmt->close();
            break;
        }

        $result = $stmt->get_result();
        $detalles = [];
        while ($row = $result->fetch_assoc()) {
            $detalles[] = [
                'iddetalle_compra' => (int)$row['iddetalle_compra'],
                'articulo'         => $row['articulo'],
                'cantidad'         => (int)$row['cantidad'],
                'subtotal'         => (float)$row['subtotal'],
                'idcosto'          => (int)$row['idcosto'],
                'idprecio'         => (int)$row['idprecio'],
            ];
        }
        $stmt->close();

        echo json_encode([
            'success'  => true,
            'detalles' => $detalles,
        ]);
        break;

    default:
        echo json_encode([
            'success' => false,
            'error'   => 'Acción no válida',
        ]);
        break;
}

$conn->close();
