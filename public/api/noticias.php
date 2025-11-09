<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

include 'conexion.php';
$conn=ConcectarBd();
$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;
    $offset = ($page - 1) * $limit;
    $search = $conn->real_escape_string($_GET['search'] ?? '');

    $where = "";
    if (!empty($search)) {
        $where = "WHERE n.titulo LIKE '%$search%' OR n.descricpion LIKE '%$search%'";
    }

    $query = "SELECT * FROM noticias n $where ORDER BY n.fecha_publicacion DESC LIMIT $limit OFFSET $offset";
    $result = $conn->query($query);

    $noticias = [];
    while ($row = $result->fetch_assoc()) {
        $noticias[] = $row;
    }

    $countQuery = "SELECT COUNT(*) as total FROM noticias n $where";
    $countResult = $conn->query($countQuery);
    $total = $countResult->fetch_assoc()['total'];

    echo json_encode([
        "success" => true,
        "noticias" => $noticias,
        "total" => intval($total)
    ]);
}

elseif ($action === 'listExtended') {
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;
    $offset = ($page - 1) * $limit;
    $search = $conn->real_escape_string($_GET['search'] ?? '');

    $where = "";
    if (!empty($search)) {
        $where = "WHERE n.titulo LIKE '%$search%' OR n.descricpion LIKE '%$search%' 
                  OR d.nombre LIKE '%$search%' OR e.ubicacion LIKE '%$search%'";
    }

    $query = "
        SELECT 
            n.idnoticias,
            n.titulo,
            n.descricpion,
            n.fecha_publicacion,
            n.imagen,
            d.nombre AS deporte,
            e.ubicacion,
            e.fecha_inicio,
            e.fecha_fin
        FROM noticias n
        INNER JOIN deporte d ON n.iddeporte = d.iddeporte
        INNER JOIN eventos e ON n.idevento = e.idevento
        $where
        ORDER BY n.fecha_publicacion DESC
        LIMIT $limit OFFSET $offset
    ";

    $result = $conn->query($query);
    $noticias = [];
    while ($row = $result->fetch_assoc()) {
        $noticias[] = $row;
    }

    $countQuery = "
        SELECT COUNT(*) as total
        FROM noticias n
        INNER JOIN deporte d ON n.iddeporte = d.iddeporte
        INNER JOIN eventos e ON n.idevento = e.idevento
        $where
    ";
    $countResult = $conn->query($countQuery);
    $total = $countResult->fetch_assoc()['total'] ?? 0;

    echo json_encode([
        "success" => true,
        "noticias" => $noticias,
        "total" => intval($total)
    ]);
}
elseif ($action === 'listDeportes') {
    $result = $conn->query("SELECT iddeporte, nombre FROM deporte ORDER BY nombre ASC");
    $deportes = [];
    while ($row = $result->fetch_assoc()) $deportes[] = $row;
    echo json_encode(["success" => true, "deportes" => $deportes]);
}
elseif ($action === 'listEventos') {
    $result = $conn->query("SELECT idevento, ubicacion, fecha_inicio, fecha_fin FROM eventos ORDER BY fecha_inicio DESC");
    $eventos = [];
    while ($row = $result->fetch_assoc()) $eventos[] = $row;
    echo json_encode(["success" => true, "eventos" => $eventos]);
}

elseif ($action === 'get') {
    $id = intval($_GET['idnoticias']);
    $query = "
        SELECT n.*, d.nombre AS deporte, e.ubicacion, e.fecha_inicio, e.fecha_fin
        FROM noticias n
        INNER JOIN deporte d ON n.iddeporte = d.iddeporte
        INNER JOIN eventos e ON n.idevento = e.idevento
        WHERE n.idnoticias = $id
    ";
    $result = $conn->query($query);

    if ($result && $result->num_rows > 0) {
        echo json_encode(["success" => true, "noticia" => $result->fetch_assoc()]);
    } else {
        echo json_encode(["success" => false, "error" => "Noticia no encontrada"]);
    }
}

elseif ($action === 'create') {
    $titulo = $_POST['titulo'] ?? '';
    $descricpion = $_POST['descricpion'] ?? '';
    $iddeporte = intval($_POST['iddeporte'] ?? 0);
    $idevento = intval($_POST['idevento'] ?? 0);

    // Subida de imagen
    $imgPath = "";
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
        $uploadDir = "../../public/uploads/noticias/";
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileName = time() . "_" . basename($_FILES['imagen']['name']);
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetPath)) {
            $imgPath = "uploads/noticias/" . $fileName;
        }
    }

    $stmt = $conn->prepare("INSERT INTO noticias (titulo, descricpion, iddeporte, idevento, imagen) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiis", $titulo, $descricpion, $iddeporte, $idevento, $imgPath);

    if ($stmt->execute()) echo json_encode(["success" => true]);
    else echo json_encode(["success" => false, "error" => "Error al crear noticia"]);

    $stmt->close();
}

elseif ($action === 'update') {
    $id = intval($_POST['idnoticias']);
    $titulo = $_POST['titulo'] ?? '';
    $descricpion = $_POST['descricpion'] ?? '';
    $iddeporte = intval($_POST['iddeporte'] ?? 0);
    $idevento = intval($_POST['idevento'] ?? 0);

    // Imagen (si se sube una nueva)
    $imgPath = "";
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
        $uploadDir = "../../public/uploads/noticias/";
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileName = time() . "_" . basename($_FILES['imagen']['name']);
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetPath)) {
            $imgPath = "uploads/noticias/" . $fileName;
        }
    }

    if (!empty($imgPath)) {
        $stmt = $conn->prepare("UPDATE noticias SET titulo=?, descricpion=?, iddeporte=?, idevento=?, imagen=? WHERE idnoticias=?");
        $stmt->bind_param("ssissi", $titulo, $descricpion, $iddeporte, $idevento, $imgPath, $id);
    } else {
        $stmt = $conn->prepare("UPDATE noticias SET titulo=?, descricpion=?, iddeporte=?, idevento=? WHERE idnoticias=?");
        $stmt->bind_param("ssiii", $titulo, $descricpion, $iddeporte, $idevento, $id);
    }

    if ($stmt->execute()) echo json_encode(["success" => true]);
    else echo json_encode(["success" => false, "error" => "Error al actualizar noticia"]);

    $stmt->close();
}

elseif ($action === 'delete') {
    $id = intval($_GET['idnoticias'] ?? $_POST['idnoticias'] ?? 0);
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM noticias WHERE idnoticias = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) echo json_encode(["success" => true]);
        else echo json_encode(["success" => false, "error" => "Error al eliminar noticia"]);
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "ID inválido"]);
    }
}

$conn->close();
?>