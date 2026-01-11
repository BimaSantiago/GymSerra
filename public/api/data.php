<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";
$conn = ConcectarBd();

function normalizeRelativeImage(string $path = null, string $folder = 'articulos'): string {
    if (empty($path)) {
        return "/uploads/{$folder}/default.jpg";
    }

    $p = str_replace('\\', '/', $path);

    if (strpos($p, 'uploads/') !== false) {
        $p = preg_replace('#^.*uploads/#', 'uploads/', $p);
        return '/' . ltrim($p, '/');
    }

    return "/uploads/{$folder}/" . basename($p);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'carruselUniformes':
        $limit = 6;
        $categoriaUniformes = 3;

        $sql = "SELECT 
                    a.idarticulo,
                    a.nombre,
                    a.descripcion,
                    a.img
                FROM articulos a
                INNER JOIN categorias c ON c.idcategoria = a.idcategoria
                WHERE a.estado = 'Activo' 
                  AND (a.idcategoria = ? OR c.id_padre = ?)
                ORDER BY a.nombre ASC
                LIMIT ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $categoriaUniformes, $categoriaUniformes, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $articulos = [];
        while ($row = $result->fetch_assoc()) {
            $articulos[] = [
                'idarticulo' => (int)$row['idarticulo'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'img' => normalizeRelativeImage($row['img'], 'articulos')
            ];
        }

        echo json_encode([
            "success" => true,
            "articulos" => $articulos
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;
    // Endpoint para el carrusel de artículos
    case 'carruselArticulos':
        $limit = 4;

        $sql = "SELECT a.idarticulo, a.nombre, a.descripcion, a.img, lp.precio
                FROM articulos a
                LEFT JOIN lista_precio lp ON lp.idarticulo = a.idarticulo
                WHERE a.estado = 'Activo'
                ORDER BY lp.fecha DESC
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $articulos = [];
        while ($row = $result->fetch_assoc()) {
            $row['img'] = normalizeRelativeImage($row['img'], 'articulos');
            $articulos[] = $row;
        }

        echo json_encode([
            "success" => true,
            "articulos" => $articulos
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;

    
        // 🏷️ Endpoint para obtener categorías principales de productos
    
        case 'categoriasProductos':
        $sql = "SELECT 
                    c.idcategoria,
                    c.nombre,
                    c.id_padre,
                    COUNT(DISTINCT a.idarticulo) as total_productos
                FROM categorias c
                LEFT JOIN articulos a ON a.idcategoria = c.idcategoria AND a.estado = 'Activo'
                WHERE c.id_padre IS NULL
                GROUP BY c.idcategoria, c.nombre, c.id_padre
                HAVING total_productos > 0 OR c.idcategoria IN (1, 3, 4)
                ORDER BY 
                    CASE 
                        WHEN c.nombre LIKE '%Uniform%' THEN 1
                        WHEN c.nombre LIKE '%Dulc%' THEN 2
                        WHEN c.nombre LIKE '%Mobil%' OR c.nombre LIKE '%Equip%' THEN 3
                        ELSE 4
                    END,
                    c.nombre ASC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            echo json_encode([
                "success" => false,
                "error" => "Error al obtener categorías: " . $conn->error
            ], JSON_UNESCAPED_UNICODE);
            break;
        }

        $categorias = [];
        while ($row = $result->fetch_assoc()) {
            $nombre = $row['nombre'];
            $esVenta = true;
            $descripcion = "";

            // Determinar si es venta o mobiliario y agregar descripción
            if (stripos($nombre, 'mobil') !== false || 
                stripos($nombre, 'equip') !== false ||
                $row['idcategoria'] == 1) {
                $esVenta = false;
                $descripcion = "Equipamiento profesional disponible para todos los alumnos durante sus clases";
            } elseif (stripos($nombre, 'uniform') !== false) {
                $descripcion = "Uniformes oficiales de alta calidad para entrenamientos y competencias";
            } elseif (stripos($nombre, 'dulc') !== false) {
                $descripcion = "Snacks saludables y dulces para disfrutar después del entrenamiento";
            }

            $categorias[] = [
                'idcategoria' => (int)$row['idcategoria'],
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'esVenta' => $esVenta,
                'total_productos' => (int)$row['total_productos']
            ];
        }

        echo json_encode([
            "success" => true,
            "categorias" => $categorias
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;

    // Endpoint para productos por categoría
    case 'productosPorCategoria':
        $idcategoria = isset($_GET['idcategoria']) ? intval($_GET['idcategoria']) : 0;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;

        if ($idcategoria <= 0) {
            echo json_encode([
                "success" => false,
                "error" => "ID de categoría inválido"
            ], JSON_UNESCAPED_UNICODE);
            break;
        }

        $sql = "SELECT 
                    a.idarticulo,
                    a.nombre,
                    a.descripcion,
                    a.img,
                    a.idcategoria,
                    c.nombre AS categoria
                FROM articulos a
                INNER JOIN categorias c ON c.idcategoria = a.idcategoria
                WHERE a.estado = 'Activo' 
                  AND (a.idcategoria = ? OR c.id_padre = ?)
                ORDER BY a.nombre ASC
                LIMIT ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $idcategoria, $idcategoria, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $articulos = [];
        while ($row = $result->fetch_assoc()) {
            $row['img'] = normalizeRelativeImage($row['img'], 'articulos');
            $articulos[] = [
                'idarticulo' => (int)$row['idarticulo'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'img' => $row['img'],
                'idcategoria' => (int)$row['idcategoria'],
                'categoria' => $row['categoria']
            ];
        }

        echo json_encode([
            "success" => true,
            "articulos" => $articulos,
            "total" => count($articulos)
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;

    default:
        echo json_encode([
            "success" => false,
            "error" => "Acción no válida o no especificada."
        ], JSON_UNESCAPED_UNICODE);
        break;
}

$conn->close();
?>