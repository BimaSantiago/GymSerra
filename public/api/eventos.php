<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'conexion.php';
$conn=ConcectarBd();

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    try {
        $sql = "SELECT e.idevento, e.fecha_inicio, e.fecha_fin, e.ubicacion, e.iddeporte, d.nombre AS deporte
                FROM eventos e
                INNER JOIN deporte d ON e.iddeporte = d.iddeporte
                ORDER BY e.fecha_inicio DESC";

        $result = $conn->query($sql);
        $eventos = [];

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $eventos[] = $row;
            }
        }

        echo json_encode(["success" => true, "eventos" => $eventos]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => "Error al listar eventos: " . $e->getMessage()]);
    }
    exit;
}

if ($action === 'create') {
    $input = json_decode(file_get_contents('php://input'), true);

    $fecha_inicio = $input['fecha_inicio'] ?? '';
    $fecha_fin = $input['fecha_fin'] ?? '';
    $ubicacion = $input['ubicacion'] ?? '';
    $iddeporte = intval($input['iddeporte'] ?? 0);

    if (empty($fecha_inicio) || empty($fecha_fin) || empty($ubicacion) || $iddeporte === 0) {
        echo json_encode(["success" => false, "error" => "Todos los campos son obligatorios."]);
        exit;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO eventos (fecha_inicio, fecha_fin, ubicacion, iddeporte) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $fecha_inicio, $fecha_fin, $ubicacion, $iddeporte);
        $success = $stmt->execute();

        echo json_encode([
            "success" => $success,
            "message" => $success ? "Evento creado correctamente." : "Error al crear el evento."
        ]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => "Error al crear evento: " . $e->getMessage()]);
    }
    exit;
}

if ($action === 'update') {
    $input = json_decode(file_get_contents('php://input'), true);

    $idevento = intval($input['idevento'] ?? 0);
    $fecha_inicio = $input['fecha_inicio'] ?? '';
    $fecha_fin = $input['fecha_fin'] ?? '';
    $ubicacion = $input['ubicacion'] ?? '';
    $iddeporte = intval($input['iddeporte'] ?? 0);

    if ($idevento === 0 || empty($fecha_inicio) || empty($fecha_fin) || empty($ubicacion) || $iddeporte === 0) {
        echo json_encode(["success" => false, "error" => "Todos los campos son obligatorios."]);
        exit;
    }

    try {
        $stmt = $conn->prepare("UPDATE eventos SET fecha_inicio = ?, fecha_fin = ?, ubicacion = ?, iddeporte = ? WHERE idevento = ?");
        $stmt->bind_param("sssii", $fecha_inicio, $fecha_fin, $ubicacion, $iddeporte, $idevento);
        $success = $stmt->execute();

        echo json_encode([
            "success" => $success,
            "message" => $success ? "Evento actualizado correctamente." : "Error al actualizar el evento."
        ]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => "Error al actualizar evento: " . $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete') {
    $idevento = intval($_GET['idevento'] ?? 0);

    if ($idevento === 0) {
        echo json_encode(["success" => false, "error" => "ID de evento no válido."]);
        exit;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM eventos WHERE idevento = ?");
        $stmt->bind_param("i", $idevento);
        $success = $stmt->execute();

        echo json_encode([
            "success" => $success,
            "message" => $success ? "Evento eliminado correctamente." : "Error al eliminar el evento."
        ]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => "Error al eliminar evento: " . $e->getMessage()]);
    }
    exit;
}

echo json_encode(["success" => false, "error" => "Acción no válida."]);
exit;
?>
