<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";
$conn=ConcectarBd();

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
    // 📦 Endpoint para el carrusel de artículos
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

    default:
        echo json_encode(["success" => false, "error" => "Acción no válida o no especificada."], JSON_UNESCAPED_UNICODE);
        break;
}

$conn->close();