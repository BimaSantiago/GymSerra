<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include "conexion.php";
$conn=ConcectarBd();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        listNiveles($conn);
        break;
    case 'create':
        createNivel($conn);
        break;
    case 'update':
        updateNivel($conn);
        break;
    default:
        echo json_encode([
            "success" => false,
            "error" => "Acción no válida"
        ]);
        break;
}

function listNiveles($conn)
{
    $niveles = [];
    $iddeporte = isset($_GET['iddeporte']) ? intval($_GET['iddeporte']) : 0;

    if ($iddeporte > 0) {
        $sql = "SELECT n.idnivel, n.nombre_nivel, n.iddeporte, d.nombre AS deporte 
                FROM nivel n 
                INNER JOIN deporte d ON n.iddeporte = d.iddeporte 
                WHERE n.iddeporte = $iddeporte 
                ";
    } else {
        $sql = "SELECT n.idnivel, n.nombre_nivel, n.iddeporte, d.nombre AS deporte 
                FROM nivel n 
                INNER JOIN deporte d ON n.iddeporte = d.iddeporte 
                ";
    }

    $result = mysqli_query($conn, $sql);

    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $niveles[] = $row;
        }
        echo json_encode([
            "success" => true,
            "niveles" => $niveles
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Error al obtener niveles: " . mysqli_error($conn)
        ]);
    }
}

/**
 * 🔹 CREAR NIVEL
 */
function createNivel($conn)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || empty($data['nombre_nivel']) || empty($data['iddeporte'])) {
        echo json_encode([
            "success" => false,
            "error" => "Datos incompletos para crear nivel"
        ]);
        return;
    }

    $nombre_nivel = mysqli_real_escape_string($conn, $data['nombre_nivel']);
    $iddeporte = intval($data['iddeporte']);

    $sql = "INSERT INTO nivel (iddeporte, nombre_nivel) VALUES ($iddeporte, '$nombre_nivel')";
    $result = mysqli_query($conn, $sql);

    if ($result) {
        $id = mysqli_insert_id($conn);
        echo json_encode([
            "success" => true,
            "message" => "Nivel creado correctamente",
            "idnivel" => $id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Error al crear nivel: " . mysqli_error($conn)
        ]);
    }
}

/**
 * 🔹 ACTUALIZAR NIVEL
 */
function updateNivel($conn)
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !$data ||
        empty($data['idnivel']) ||
        empty($data['nombre_nivel']) ||
        empty($data['iddeporte'])
    ) {
        echo json_encode([
            "success" => false,
            "error" => "Datos incompletos para actualizar nivel"
        ]);
        return;
    }

    $idnivel = intval($data['idnivel']);
    $iddeporte = intval($data['iddeporte']);
    $nombre_nivel = mysqli_real_escape_string($conn, $data['nombre_nivel']);

    $sql = "UPDATE nivel 
            SET nombre_nivel = '$nombre_nivel', iddeporte = $iddeporte 
            WHERE idnivel = $idnivel";

    $result = mysqli_query($conn, $sql);

    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Nivel actualizado correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Error al actualizar nivel: " . mysqli_error($conn)
        ]);
    }
}
?>
