<?php
include "conexion.php";

header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
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
    // LISTAR ARTÍCULOS (JOIN categorías + unidad_medida)
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
                    a.nombre LIKE '%$searchEsc%' OR
                    a.codigo_barras LIKE '%$searchEsc%' OR
                    c.nombre LIKE '%$searchEsc%'
            ";
        }

        $sqlTotal = "
            SELECT COUNT(*) AS total
            FROM articulos a
            INNER JOIN categorias c ON a.idcategoria = c.idcategoria
            INNER JOIN unidad_medida u ON a.idunidad = u.idunidad
            $where
        ";
        $resTotal = $conn->query($sqlTotal);
        $total = 0;
        if ($resTotal && $rowT = $resTotal->fetch_assoc()) {
            $total = (int)$rowT['total'];
        }

        $sql = "
            SELECT
                a.idarticulo,
                a.nombre,
                a.codigo_barras,
                a.descripcion,
                a.descripcion2,
                a.stock,
                a.estado,
                a.ganancia,
                a.iva_aplicable,
                a.idunidad,
                a.idcategoria,
                a.img,
                u.clave AS unidad_clave,
                u.descripcion AS unidad_descripcion,
                c.nombre AS categoria_nombre
            FROM articulos a
            INNER JOIN categorias c ON a.idcategoria = c.idcategoria
            INNER JOIN unidad_medida u ON a.idunidad = u.idunidad
            $where
            ORDER BY a.idarticulo DESC
            LIMIT $limit OFFSET $offset
        ";

        $result = $conn->query($sql);
        if (!$result) {
            echo json_encode([
                "success" => false,
                "error" => "Error al obtener artículos: " . $conn->error
            ]);
            break;
        }

        $articulos = [];
        while ($row = $result->fetch_assoc()) {
            $articulos[] = [
                "idarticulo"        => (int)$row["idarticulo"],
                "nombre"            => $row["nombre"],
                "codigo_barras"     => $row["codigo_barras"],
                "descripcion"       => $row["descripcion"],
                "descripcion2"      => $row["descripcion2"],
                "stock"             => (int)$row["stock"],
                "estado"            => $row["estado"],
                "ganancia"          => (float)$row["ganancia"],
                "iva_aplicable"     => $row["iva_aplicable"],
                "idunidad"          => (int)$row["idunidad"],
                "idcategoria"       => (int)$row["idcategoria"],
                "img"               => $row["img"],
                "unidad_clave"      => $row["unidad_clave"],
                "unidad_descripcion"=> $row["unidad_descripcion"],
                "categoria_nombre"  => $row["categoria_nombre"],
            ];
        }

        echo json_encode([
            "success"   => true,
            "articulos" => $articulos,
            "total"     => $total,
            "page"      => $page,
            "limit"     => $limit
        ]);
        break;

    // ============================================================
    // OBTENER UN ARTÍCULO
    // ============================================================
    case 'get':
        $id = isset($_GET['idarticulo']) ? (int)$_GET['idarticulo'] : 0;
        if ($id <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID inválido"
            ]);
            break;
        }

        $sql = "
            SELECT
                a.idarticulo,
                a.nombre,
                a.codigo_barras,
                a.descripcion,
                a.descripcion2,
                a.stock,
                a.estado,
                a.ganancia,
                a.iva_aplicable,
                a.idunidad,
                a.idcategoria,
                a.img,
                u.clave AS unidad_clave,
                u.descripcion AS unidad_descripcion,
                c.nombre AS categoria_nombre
            FROM articulos a
            INNER JOIN categorias c ON a.idcategoria = c.idcategoria
            INNER JOIN unidad_medida u ON a.idunidad = u.idunidad
            WHERE a.idarticulo = ?
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
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            echo json_encode([
                "success"  => true,
                "articulo" => [
                    "idarticulo"        => (int)$row["idarticulo"],
                    "nombre"            => $row["nombre"],
                    "codigo_barras"     => $row["codigo_barras"],
                    "descripcion"       => $row["descripcion"],
                    "descripcion2"      => $row["descripcion2"],
                    "stock"             => (int)$row["stock"],
                    "estado"            => $row["estado"],
                    "ganancia"          => (float)$row["ganancia"],
                    "iva_aplicable"     => $row["iva_aplicable"],
                    "idunidad"          => (int)$row["idunidad"],
                    "idcategoria"       => (int)$row["idcategoria"],
                    "img"               => $row["img"],
                    "unidad_clave"      => $row["unidad_clave"],
                    "unidad_descripcion"=> $row["unidad_descripcion"],
                    "categoria_nombre"  => $row["categoria_nombre"],
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Artículo no encontrado"
            ]);
        }
        $stmt->close();
        break;

    // ============================================================
    // CREAR ARTÍCULO
    // ============================================================
    case 'create':
        $nombre        = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
        $codigo_barras = isset($_POST["codigo_barras"]) ? trim($_POST["codigo_barras"]) : "";
        $descripcion   = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
        $descripcion2  = isset($_POST["descripcion2"]) ? trim($_POST["descripcion2"]) : "Mobiliario";
        $estado        = isset($_POST["estado"]) ? trim($_POST["estado"]) : "Activo";
        $stock         = isset($_POST["stock"]) ? (int)$_POST["stock"] : 0;
        $ganancia      = isset($_POST["ganancia"]) ? (float)$_POST["ganancia"] : 0.0;
        $iva_aplicable = isset($_POST["iva_aplicable"]) ? trim($_POST["iva_aplicable"]) : "No";
        $idunidad      = isset($_POST["idunidad"]) ? (int)$_POST["idunidad"] : 0;
        $idcategoria   = isset($_POST["idcategoria"]) ? (int)$_POST["idcategoria"] : 0;

        if ($nombre === "" || $idunidad <= 0 || $idcategoria <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "Nombre, categoría y unidad de medida son obligatorios"
            ]);
            break;
        }

        // Forzar valores si es mobiliario
        if ($descripcion2 === "Mobiliario") {
            $ganancia = 0;
            $iva_aplicable = "No";
        }

        // Procesar imagen
        $imgPath = null;
        if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
            $uploadDir = "../uploads/articulos/";
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            $tmpName  = $_FILES["imagen"]["tmp_name"];
            $origName = basename($_FILES["imagen"]["name"]);
            $ext      = pathinfo($origName, PATHINFO_EXTENSION);
            $fileName = "art_" . time() . "_" . mt_rand(1000, 9999) . "." . $ext;
            $dest     = $uploadDir . $fileName;

            if (move_uploaded_file($tmpName, $dest)) {
                $imgPath = "uploads/articulos/" . $fileName;
            }
        }

        $sql = "
            INSERT INTO articulos
                (nombre, codigo_barras, descripcion, descripcion2, stock, estado,
                 ganancia, iva_aplicable, idunidad, idcategoria, img)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar inserción: " . $conn->error
            ]);
            break;
        }

        $stmt->bind_param(
            "ssssisdsiis",
            $nombre,
            $codigo_barras,
            $descripcion,
            $descripcion2,
            $stock,
            $estado,
            $ganancia,
            $iva_aplicable,
            $idunidad,
            $idcategoria,
            $imgPath
        );

        if ($stmt->execute()) {
            $newId = (int)$conn->insert_id;
            echo json_encode([
                "success"    => true,
                "msg"        => "Artículo creado correctamente",
                "idarticulo" => $newId,
                "img"        => $imgPath
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Error al crear artículo: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    // ============================================================
    // ACTUALIZAR ARTÍCULO
    // ============================================================
    case 'update':
        $idarticulo    = isset($_POST["idarticulo"]) ? (int)$_POST["idarticulo"] : 0;
        $nombre        = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
        $codigo_barras = isset($_POST["codigo_barras"]) ? trim($_POST["codigo_barras"]) : "";
        $descripcion   = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
        $descripcion2  = isset($_POST["descripcion2"]) ? trim($_POST["descripcion2"]) : "Mobiliario";
        $estado        = isset($_POST["estado"]) ? trim($_POST["estado"]) : "Activo";
        $stock         = isset($_POST["stock"]) ? (int)$_POST["stock"] : 0;
        $ganancia      = isset($_POST["ganancia"]) ? (float)$_POST["ganancia"] : 0.0;
        $iva_aplicable = isset($_POST["iva_aplicable"]) ? trim($_POST["iva_aplicable"]) : "No";
        $idunidad      = isset($_POST["idunidad"]) ? (int)$_POST["idunidad"] : 0;
        $idcategoria   = isset($_POST["idcategoria"]) ? (int)$_POST["idcategoria"] : 0;

        if ($idarticulo <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID inválido para actualizar"
            ]);
            break;
        }

        if ($nombre === "" || $idunidad <= 0 || $idcategoria <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "Nombre, categoría y unidad de medida son obligatorios"
            ]);
            break;
        }

        if ($descripcion2 === "Mobiliario") {
            $ganancia = 0;
            $iva_aplicable = "No";
        }

        // Obtener imagen actual
        $imgActual = null;
        $resImg = $conn->query("SELECT img FROM articulos WHERE idarticulo = $idarticulo LIMIT 1");
        if ($resImg && $rowImg = $resImg->fetch_assoc()) {
            $imgActual = $rowImg["img"];
        }

        $imgPath = $imgActual;
        if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
            $uploadDir = "../uploads/articulos/";
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            $tmpName  = $_FILES["imagen"]["tmp_name"];
            $origName = basename($_FILES["imagen"]["name"]);
            $ext      = pathinfo($origName, PATHINFO_EXTENSION);
            $fileName = "art_" . time() . "_" . mt_rand(1000, 9999) . "." . $ext;
            $dest     = $uploadDir . $fileName;

            if (move_uploaded_file($tmpName, $dest)) {
                $imgPath = "uploads/articulos/" . $fileName;
            }
        }

        $sql = "
            UPDATE articulos
            SET
              nombre        = ?,
              codigo_barras = ?,
              descripcion   = ?,
              descripcion2  = ?,
              stock         = ?,
              estado        = ?,
              ganancia      = ?,
              iva_aplicable = ?,
              idunidad      = ?,
              idcategoria   = ?,
              img           = ?
            WHERE idarticulo = ?
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar actualización: " . $conn->error
            ]);
            break;
        }

        $stmt->bind_param(
            "ssssisdsiisi",
            $nombre,
            $codigo_barras,
            $descripcion,
            $descripcion2,
            $stock,
            $estado,
            $ganancia,
            $iva_aplicable,
            $idunidad,
            $idcategoria,
            $imgPath,
            $idarticulo
        );

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "msg"     => "Artículo actualizado correctamente",
                "img"     => $imgPath
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Error al actualizar artículo: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    // ============================================================
    // VINCULAR PROVEEDOR A ARTÍCULO (tabla articulo_proveedor)
    // ============================================================
    case 'link_proveedor':
        $input = json_decode(file_get_contents("php://input"), true);
        $idarticulo  = isset($input["idarticulo"]) ? (int)$input["idarticulo"] : 0;
        $idproveedor = isset($input["idproveedor"]) ? (int)$input["idproveedor"] : 0;

        if ($idarticulo <= 0 || $idproveedor <= 0) {
            echo json_encode([
                "success" => false,
                "error"   => "ID de artículo o proveedor inválido"
            ]);
            break;
        }

        // Insertar si no existe
        $sql = "
            INSERT IGNORE INTO articulo_proveedor (idarticulo, idproveedor)
            VALUES (?, ?)
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "error"   => "Error al preparar vínculo: " . $conn->error
            ]);
            break;
        }
        $stmt->bind_param("ii", $idarticulo, $idproveedor);

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "msg"     => "Proveedor vinculado correctamente"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error"   => "Error al vincular proveedor: " . $stmt->error
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
