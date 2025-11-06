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
    try {
      $query = "
        SELECT p.idplan, p.idnivel, n.nombre_nivel AS nivel, 
               p.dias_por_semana, p.costo, p.costo_promocion, p.costo_penalizacion
        FROM plan_pago p
        JOIN nivel n ON p.idnivel = n.idnivel
        ORDER BY p.idnivel, p.dias_por_semana ASC
      ";
      $result = $conn->query($query);
      $planes = $result->fetch_all(MYSQLI_ASSOC);
      echo json_encode(['success' => true, 'planes' => $planes]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al obtener planes: ' . $e->getMessage()]);
    }
    break;

  case 'create':
    $data = json_decode(file_get_contents("php://input"), true);
    $idnivel = intval($data['idnivel'] ?? 0);
    $dias = intval($data['dias_por_semana'] ?? 0);
    $costo = floatval($data['costo'] ?? 0);
    $promo = floatval($data['costo_promocion'] ?? 0);
    $penal = floatval($data['costo_penalizacion'] ?? 0);

    if ($idnivel <= 0 || $dias <= 0) {
      echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        INSERT INTO plan_pago (idnivel, dias_por_semana, costo, costo_promocion, costo_penalizacion)
        VALUES (?, ?, ?, ?, ?)
      ");
      $stmt->bind_param("iiddd", $idnivel, $dias, $costo, $promo, $penal);
      $stmt->execute();
      echo json_encode(['success' => true, 'idplan' => $conn->insert_id]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al crear plan: ' . $e->getMessage()]);
    }
    break;


  case 'update':
    $data = json_decode(file_get_contents("php://input"), true);
    $idplan = intval($data['idplan'] ?? 0);
    $idnivel = intval($data['idnivel'] ?? 0);
    $dias = intval($data['dias_por_semana'] ?? 0);
    $costo = floatval($data['costo'] ?? 0);
    $promo = floatval($data['costo_promocion'] ?? 0);
    $penal = floatval($data['costo_penalizacion'] ?? 0);

    if ($idplan <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID de plan inválido']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        UPDATE plan_pago 
        SET idnivel=?, dias_por_semana=?, costo=?, costo_promocion=?, costo_penalizacion=? 
        WHERE idplan=?
      ");
      $stmt->bind_param("iidddi", $idnivel, $dias, $costo, $promo, $penal, $idplan);
      $stmt->execute();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al actualizar plan: ' . $e->getMessage()]);
    }
    break;

  case 'delete':
    $idplan = intval($_GET['idplan'] ?? 0);
    if ($idplan <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID inválido']);
      exit;
    }

    try {
      $stmt = $conn->prepare("DELETE FROM plan_pago WHERE idplan=?");
      $stmt->bind_param("i", $idplan);
      $stmt->execute();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Error al eliminar plan: ' . $e->getMessage()]);
    }
    break;

  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    break;
}
?>
