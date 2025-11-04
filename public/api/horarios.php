<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include './conexion.php';
$conn=ConcectarBd();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listarHorarios($conn);
        break;
    case 'get':
        obtenerHorario($conn);
        break;
    case 'create':
        crearHorario($conn);
        break;
    case 'update':
        actualizarHorario($conn);
        break;
    default:
        echo json_encode(["success" => false, "error" => "Acción no válida"]);
}

$conn->close();


function listarHorarios($conn)
{
    $query = "SELECT 
                h.idhorario,
                h.hora_inicio,
                h.hora_fin,
                h.dia,
                d.nombre AS deporte,
                n.nombre_nivel AS nivel
              FROM horarios h
              INNER JOIN deporte d ON h.iddeporte = d.iddeporte
              INNER JOIN nivel n ON h.idnivel = n.idnivel
              ORDER BY h.dia, h.hora_inicio ASC";

    $result = $conn->query($query);

    $horarios = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $horarios[] = $row;
        }
    }

    echo json_encode(["success" => true, "horarios" => $horarios]);
}


function obtenerHorario($conn)
{
    $idhorario = $_GET['idhorario'] ?? 0;
    if (!$idhorario) {
        echo json_encode(["success" => false, "error" => "Falta el parámetro idhorario"]);
        return;
    }

    $stmt = $conn->prepare("SELECT * FROM horarios WHERE idhorario = ?");
    $stmt->bind_param("i", $idhorario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode(["success" => true, "horario" => $row]);
    } else {
        echo json_encode(["success" => false, "error" => "Horario no encontrado"]);
    }

    $stmt->close();
}


function crearHorario($conn)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['hora_inicio']) ||
        !isset($data['hora_fin']) ||
        !isset($data['dia']) ||
        !isset($data['iddeporte']) ||
        !isset($data['idnivel'])
    ) {
        echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO horarios (hora_inicio, hora_fin, dia, iddeporte, idnivel) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iiiii", $data['hora_inicio'], $data['hora_fin'], $data['dia'], $data['iddeporte'], $data['idnivel']);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Horario creado correctamente"]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al insertar el horario: " . $conn->error]);
    }

    $stmt->close();
}


function actualizarHorario($conn)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['idhorario'])) {
        echo json_encode(["success" => false, "error" => "Falta el idhorario"]);
        return;
    }

    $stmt = $conn->prepare("UPDATE horarios 
                            SET hora_inicio = ?, hora_fin = ?, dia = ?, iddeporte = ?, idnivel = ?
                            WHERE idhorario = ?");
    $stmt->bind_param(
        "iiiiii",
        $data['hora_inicio'],
        $data['hora_fin'],
        $data['dia'],
        $data['iddeporte'],
        $data['idnivel'],
        $data['idhorario']
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Horario actualizado correctamente"]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al actualizar el horario: " . $conn->error]);
    }

    $stmt->close();
}
?>
