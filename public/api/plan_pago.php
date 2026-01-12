<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include 'conexion.php';
$conn = ConcectarBd();

$action = $_GET['action'] ?? '';

switch ($action) {

  /* ================== LISTAR PLANES ================== */
  case 'list':
    try {
      $query = "
        SELECT 
          p.idplan,
          p.iddeporte,
          d.nombre AS deporte,
          p.dias_por_semana,
          p.costo,
          p.costo_promocion,
          p.costo_penalizacion
        FROM plan_pago p
        INNER JOIN deporte d ON d.iddeporte = p.iddeporte
        ORDER BY p.iddeporte, p.dias_por_semana ASC
      ";
      $result = $conn->query($query);
      if (!$result) {
        throw new Exception($conn->error);
      }

      $planes = [];
      while ($row = $result->fetch_assoc()) {
        $planes[] = [
          "idplan"             => (int)$row["idplan"],
          "iddeporte"          => (int)$row["iddeporte"],
          "deporte"            => $row["deporte"],
          "dias_por_semana"    => (int)$row["dias_por_semana"],
          "costo"              => (float)$row["costo"],
          "costo_promocion"    => (float)$row["costo_promocion"],
          "costo_penalizacion" => (float)$row["costo_penalizacion"],
        ];
      }

      echo json_encode([
        'success' => true,
        'planes'  => $planes,
      ]);
    } catch (Exception $e) {
      echo json_encode([
        'success' => false,
        'error'   => 'Error al obtener planes: ' . $e->getMessage(),
      ]);
    }
    break;

  /* ================== CREAR PLAN ================== */
  case 'create':
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    $iddeporte = intval($data['iddeporte'] ?? 0);
    $dias      = intval($data['dias_por_semana'] ?? 0);
    $costo     = floatval($data['costo'] ?? 0);
    $promo     = floatval($data['costo_promocion'] ?? 0);
    $penal     = floatval($data['costo_penalizacion'] ?? 0);

    if ($iddeporte <= 0 || $dias <= 0) {
      echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        INSERT INTO plan_pago (iddeporte, dias_por_semana, costo, costo_promocion, costo_penalizacion)
        VALUES (?, ?, ?, ?, ?)
      ");
      if (!$stmt) {
        throw new Exception($conn->error);
      }

      $stmt->bind_param("iiddd", $iddeporte, $dias, $costo, $promo, $penal);
      $stmt->execute();

      echo json_encode([
        'success' => true,
        'idplan'  => $conn->insert_id,
      ]);
    } catch (Exception $e) {
      echo json_encode([
        'success' => false,
        'error'   => 'Error al crear plan: ' . $e->getMessage(),
      ]);
    }
    break;

  /* ================== ACTUALIZAR PLAN ================== */
  case 'update':
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    $idplan    = intval($data['idplan'] ?? 0);
    $iddeporte = intval($data['iddeporte'] ?? 0);
    $dias      = intval($data['dias_por_semana'] ?? 0);
    $costo     = floatval($data['costo'] ?? 0);
    $promo     = floatval($data['costo_promocion'] ?? 0);
    $penal     = floatval($data['costo_penalizacion'] ?? 0);

    if ($idplan <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID de plan inválido']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        UPDATE plan_pago
        SET iddeporte = ?, dias_por_semana = ?, costo = ?, costo_promocion = ?, costo_penalizacion = ?
        WHERE idplan = ?
      ");
      if (!$stmt) {
        throw new Exception($conn->error);
      }

      $stmt->bind_param("iidddi", $iddeporte, $dias, $costo, $promo, $penal, $idplan);
      $stmt->execute();

      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      echo json_encode([
        'success' => false,
        'error'   => 'Error al actualizar plan: ' . $e->getMessage(),
      ]);
    }
    break;

  /* ================== ELIMINAR PLAN ================== */
  case 'delete':
    $idplan = intval($_GET['idplan'] ?? 0);
    if ($idplan <= 0) {
      echo json_encode(['success' => false, 'error' => 'ID inválido']);
      exit;
    }

    try {
      $stmt = $conn->prepare("DELETE FROM plan_pago WHERE idplan = ?");
      if (!$stmt) {
        throw new Exception($conn->error);
      }

      $stmt->bind_param("i", $idplan);
      $stmt->execute();
      echo json_encode(['success' => true]);
    } catch (Exception $e) {
      echo json_encode([
        'success' => false,
        'error'   => 'Error al eliminar plan: ' . $e->getMessage(),
      ]);
    }
    break;

  default:
    echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    break;
}

$conn->close();
