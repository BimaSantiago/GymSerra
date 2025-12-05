<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

$action = $_GET["action"] ?? "";

try {
  // AJUSTA usuario y contraseña
  $pdo = new PDO(
    "mysql:host=localhost;dbname=gym_serra_1;charset=utf8mb4",
    "root",
    "patitojuan73",
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]
  );
} catch (Exception $e) {
  echo json_encode(["success" => false, "error" => "Error de conexión"]);
  exit;
}

function json_response($data) {
  echo json_encode($data);
  exit;
}

switch ($action) {
  /* ==================== LISTAR MENSUALIDADES (PAGINADO + BÚSQUEDA) ==================== */
  case "list":
    $page   = isset($_GET["page"]) ? (int)$_GET["page"] : 1;
    $limit  = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    $search = isset($_GET["search"]) ? trim($_GET["search"]) : "";

    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 10;

    $offset = ($page - 1) * $limit;

    $where  = "";
    $params = [];

    if ($search !== "") {
      $where = "
        WHERE 
          a.nombre_completo LIKE :search
          OR d.nombre LIKE :search
          OR m.estado LIKE :search
      ";
      $params[":search"] = "%" . $search . "%";
    }

    // Consulta principal con LIMIT / OFFSET
    $sql = "
      SELECT 
        m.idmensualidad,
        m.idalumno,
        a.nombre_completo AS nombre_alumno,
        m.idplan,
        d.nombre AS nombre_deporte,
        NULL AS nombre_nivel,
        pp.dias_por_semana,
        m.total_pagado,
        m.fecha_pago,
        m.estado
      FROM mensualidad m
      INNER JOIN alumnos a    ON m.idalumno   = a.idalumno
      INNER JOIN plan_pago pp ON m.idplan     = pp.idplan
      INNER JOIN deporte d    ON pp.iddeporte = d.iddeporte
      $where
      ORDER BY m.fecha_pago DESC
      LIMIT :offset, :limit
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
      $stmt->bindValue($k, $v, PDO::PARAM_STR);
    }
    $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
    $stmt->bindValue(":limit",  $limit,  PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Total para la paginación
    $sqlTotal = "
      SELECT COUNT(*)
      FROM mensualidad m
      INNER JOIN alumnos a    ON m.idalumno   = a.idalumno
      INNER JOIN plan_pago pp ON m.idplan     = pp.idplan
      INNER JOIN deporte d    ON pp.iddeporte = d.iddeporte
      $where
    ";
    $stmtTotal = $pdo->prepare($sqlTotal);
    if ($search !== "") {
      $stmtTotal->bindValue(":search", "%" . $search . "%", PDO::PARAM_STR);
    }
    $stmtTotal->execute();
    $total = (int)$stmtTotal->fetchColumn();

    json_response([
      "success"        => true,
      "mensualidades"  => $rows,
      "total"          => $total,
      "page"           => $page,
      "limit"          => $limit,
    ]);
    break;

  /* ==================== LISTAR ALUMNOS (CON EDAD) ==================== */
  case "list_alumnos":
    $sql = "
      SELECT 
        idalumno, 
        nombre_completo,
        TIMESTAMPDIFF(YEAR, f_nacimiento, CURDATE()) AS edad
      FROM alumnos
      ORDER BY nombre_completo
    ";
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    json_response([
      "success" => true,
      "alumnos" => $rows,
    ]);
    break;

  /* ==================== CREAR / ACTUALIZAR MENSUALIDAD ==================== */
  case "create":
  case "update":
    $input = json_decode(file_get_contents("php://input"), true);

    $idalumno      = isset($input["idalumno"]) ? (int)$input["idalumno"] : 0;
    $idplan        = isset($input["idplan"]) ? (int)$input["idplan"] : 0;
    $fecha_pago    = $input["fecha_pago"] ?? date("Y-m-d");
    $idmensualidad = isset($input["idmensualidad"]) ? (int)$input["idmensualidad"] : null;

    if ($idalumno <= 0 || $idplan <= 0) {
      json_response(["success" => false, "error" => "Datos incompletos"]);
    }

    // ==================== 1) EVITAR PAGO DUPLICADO EN EL MISMO MES ====================
    $sqlCheck = "
      SELECT COUNT(*) 
      FROM mensualidad
      WHERE idalumno = :idalumno
      AND YEAR(fecha_pago) = YEAR(:fecha_pago)
      AND MONTH(fecha_pago) = MONTH(:fecha_pago)
    ";

    if ($action === "update" && $idmensualidad) {
      $sqlCheck .= " AND idmensualidad <> :idmensualidad";
    }

    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->bindValue(":idalumno", $idalumno, PDO::PARAM_INT);
    $stmtCheck->bindValue(":fecha_pago", $fecha_pago);
    if ($action === "update" && $idmensualidad) {
      $stmtCheck->bindValue(":idmensualidad", $idmensualidad, PDO::PARAM_INT);
    }
    $stmtCheck->execute();
    $existe = (int)$stmtCheck->fetchColumn();

    if ($existe > 0) {
      json_response([
        "success" => false,
        "error"   => "El alumno ya tiene un pago registrado en este mes.",
      ]);
    }

    // ==================== 2) OBTENER PLAN + EDAD DEL ALUMNO ====================
    //   - Se usa fecha_pago para calcular la edad en la fecha del pago
    $stmt = $pdo->prepare("
      SELECT 
        p.costo,
        p.costo_promocion,
        p.costo_penalizacion,
        p.iddeporte,
        TIMESTAMPDIFF(YEAR, a.f_nacimiento, :fecha_pago) AS edad
      FROM plan_pago p
      JOIN alumnos a ON a.idalumno = :idalumno
      WHERE p.idplan = :idplan
    ");
    $stmt->execute([
      ":fecha_pago" => $fecha_pago,
      ":idalumno"   => $idalumno,
      ":idplan"     => $idplan,
    ]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
      json_response(["success" => false, "error" => "Plan no encontrado"]);
    }

    $edad      = isset($plan["edad"]) ? (int)$plan["edad"] : 0;
    $iddeporte = isset($plan["iddeporte"]) ? (int)$plan["iddeporte"] : 0;

    // ==================== 3) REGLA: GIMNASIA INICIAL (iddeporte = 1) NO PERMITE > 12 AÑOS ====================
    if ($iddeporte === 1 && $edad > 12) {
      json_response([
        "success" => false,
        "error"   => "No se puede registrar mensualidad de Gimnasia Inicial para alumnos mayores de 12 años.",
      ]);
    }

    // ==================== 4) CALCULAR TOTAL SEGÚN FECHA ====================
    $dia = (int)date("d", strtotime($fecha_pago));
    if ($dia <= 10) {
      $total = $plan["costo_promocion"];
    } elseif ($dia <= 20) {
      $total = $plan["costo"];
    } else {
      $total = $plan["costo_penalizacion"];
    }

    // ==================== 5) INSERT / UPDATE ====================
    if ($action === "create") {
      $stmt = $pdo->prepare("
        INSERT INTO mensualidad (idalumno, fecha_pago, idplan, total_pagado, estado)
        VALUES (?, ?, ?, ?, 'Pagado')
      ");
      $stmt->execute([$idalumno, $fecha_pago, $idplan, $total]);

      json_response([
        "success" => true,
        "msg"     => "Mensualidad creada correctamente.",
      ]);
    } else { // update
      if (!$idmensualidad) {
        json_response([
          "success" => false,
          "error"   => "ID de mensualidad requerido para actualizar",
        ]);
      }

      $stmt = $pdo->prepare("
        UPDATE mensualidad
        SET idalumno = ?, fecha_pago = ?, idplan = ?, total_pagado = ?, estado = 'Pagado'
        WHERE idmensualidad = ?
      ");
      $stmt->execute([$idalumno, $fecha_pago, $idplan, $total, $idmensualidad]);

      json_response([
        "success" => true,
        "msg"     => "Mensualidad actualizada correctamente.",
      ]);
    }

    break;

  default:
    json_response(["success" => false, "error" => "Acción no válida"]);
}
