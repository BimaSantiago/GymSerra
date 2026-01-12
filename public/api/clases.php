<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: https://academiagymserra.garzas.store");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

include "conexion.php";
$conn = ConcectarBd();

$action = $_GET["action"] ?? "";

switch ($action) {
  case "deportes":
    getDeportes($conn);
    break;
  case "planes":
    getPlanes($conn);
    break;
  case "horarios":
    getHorarios($conn);
    break;
  case "horariosGimnasiaInicial":
    getHorariosGimnasiaInicial($conn);
    break;
  case "instructores":
    getInstructores($conn);
    break;
  case "verificarAlumno":
    verificarAlumno($conn);
    break;
  case "registrarClasePrueba":
    registrarClasePrueba($conn);
    break;
  default:
    echo json_encode([
      "success" => false,
      "error"   => "Acción no válida",
    ]);
    break;
}

$conn->close();
exit;

/**
 * OBTENER DEPORTES
 * Devuelve todos los deportes con su información básica
 */
function getDeportes(mysqli $conn): void {
  $sql = "
    SELECT 
      iddeporte,
      nombre,
      descripcion,
      color
    FROM deporte
    WHERE iddeporte != 5
    ORDER BY nombre DESC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener deportes: " . $conn->error,
    ]);
    return;
  }

  $deportes = [];
  while ($row = $res->fetch_assoc()) {
    $deportes[] = [
      "iddeporte"  => (int)$row["iddeporte"],
      "nombre"     => $row["nombre"],
      "descripcion"=> $row["descripcion"],
      "color"      => $row["color"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "deportes" => $deportes,
  ]);
}

/**
 * OBTENER PLANES DE PAGO
 * Devuelve todos los planes con información del deporte
 */
function getPlanes(mysqli $conn): void {
  $sql = "
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
    ORDER BY p.iddeporte ASC, p.dias_por_semana ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener planes: " . $conn->error,
    ]);
    return;
  }

  $planes = [];
  while ($row = $res->fetch_assoc()) {
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
    "success" => true,
    "planes"  => $planes,
  ]);
}

/**
 * OBTENER HORARIOS
 * Devuelve todos los horarios con información del deporte y nivel
 */
function getHorarios(mysqli $conn): void {
  $sql = "
    SELECT
      h.idhorario,
      h.hora_inicio,
      h.hora_fin,
      h.dia,
      h.iddeporte,
      h.idnivel,
      d.nombre       AS deporte,
      d.color        AS color,
      n.nombre_nivel AS nivel
    FROM horarios h
    INNER JOIN deporte d ON d.iddeporte = h.iddeporte
    INNER JOIN nivel   n ON n.idnivel   = h.idnivel
    ORDER BY h.dia ASC, h.hora_inicio ASC, h.idhorario ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener horarios: " . $conn->error,
    ]);
    return;
  }

  $horarios = [];
  while ($row = $res->fetch_assoc()) {
    $horarios[] = [
      "idhorario"   => (int)$row["idhorario"],
      "hora_inicio" => (int)$row["hora_inicio"],
      "hora_fin"    => (int)$row["hora_fin"],
      "dia"         => (int)$row["dia"],
      "iddeporte"   => (int)$row["iddeporte"],
      "idnivel"     => (int)$row["idnivel"],
      "deporte"     => $row["deporte"],
      "nivel"       => $row["nivel"],
      "color"       => $row["color"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "horarios" => $horarios,
  ]);
}

/**
 * OBTENER HORARIOS DE GIMNASIA INICIAL (iddeporte = 1)
 * Solo para clase de prueba
 */
function getHorariosGimnasiaInicial(mysqli $conn): void {
  $sql = "
    SELECT
      h.idhorario,
      h.hora_inicio,
      h.hora_fin,
      h.dia,
      h.iddeporte,
      h.idnivel,
      d.nombre       AS deporte,
      d.color        AS color,
      n.nombre_nivel AS nivel
    FROM horarios h
    INNER JOIN deporte d ON d.iddeporte = h.iddeporte
    INNER JOIN nivel   n ON n.idnivel   = h.idnivel
    WHERE h.iddeporte = 1
    ORDER BY h.dia ASC, h.hora_inicio ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener horarios: " . $conn->error,
    ]);
    return;
  }

  $horarios = [];
  while ($row = $res->fetch_assoc()) {
    $horarios[] = [
      "idhorario"   => (int)$row["idhorario"],
      "hora_inicio" => (int)$row["hora_inicio"],
      "hora_fin"    => (int)$row["hora_fin"],
      "dia"         => (int)$row["dia"],
      "iddeporte"   => (int)$row["iddeporte"],
      "idnivel"     => (int)$row["idnivel"],
      "deporte"     => $row["deporte"],
      "nivel"       => $row["nivel"],
      "color"       => $row["color"],
    ];
  }

  echo json_encode([
    "success"  => true,
    "horarios" => $horarios,
  ]);
}

/**
 * OBTENER INSTRUCTORES ACTIVOS
 * Devuelve solo instructores con estado 'Activo' e incluye avatar
 */
function getInstructores(mysqli $conn): void {
  $sql = "
    SELECT
      i.idinstructor,
      i.iddeporte,
      i.nombre,
      i.appaterno,
      i.apmaterno,
      i.telefono,
      i.correo,
      i.avatar
    FROM instructores i
    WHERE i.estado = 'Activo'
    ORDER BY i.iddeporte ASC, i.nombre ASC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    echo json_encode([
      "success" => false,
      "error"   => "Error al obtener instructores: " . $conn->error,
    ]);
    return;
  }

  $instructores = [];
  while ($row = $res->fetch_assoc()) {
    $instructores[] = [
      "idinstructor" => (int)$row["idinstructor"],
      "iddeporte"    => (int)$row["iddeporte"],
      "nombre"       => $row["nombre"],
      "appaterno"    => $row["appaterno"],
      "apmaterno"    => $row["apmaterno"],
      "telefono"     => $row["telefono"],
      "correo"       => $row["correo"],
      "avatar"       => $row["avatar"] ?? null,
    ];
  }

  echo json_encode([
    "success"      => true,
    "instructores" => $instructores,
  ]);
}

/**
 * VERIFICAR SI ALUMNO YA TIENE CLASE DE PRUEBA
 * Verifica por CURP si el alumno ya está registrado en clase_prueba
 */
function verificarAlumno(mysqli $conn): void {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];
  $curp = strtoupper(trim($data['curp'] ?? ''));

  if (empty($curp)) {
    echo json_encode([
      "success" => false,
      "error"   => "CURP es requerido"
    ]);
    return;
  }

  // Verificar si existe el alumno
  $sql = "SELECT idalumno, nombre_completo FROM alumnos WHERE UPPER(curp) = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $curp);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows === 0) {
    echo json_encode([
      "success" => true,
      "existe" => false,
      "mensaje" => "Alumno no encontrado. Puede registrarse."
    ]);
    return;
  }

  $alumno = $result->fetch_assoc();
  $idalumno = $alumno['idalumno'];

  // Verificar si ya tiene clase de prueba
  $sql2 = "SELECT idclase_prueba FROM clase_prueba WHERE idalumno = ?";
  $stmt2 = $conn->prepare($sql2);
  $stmt2->bind_param("i", $idalumno);
  $stmt2->execute();
  $result2 = $stmt2->get_result();

  if ($result2->num_rows > 0) {
    echo json_encode([
      "success" => false,
      "existe" => true,
      "yaRegistrado" => true,
      "mensaje" => "Este alumno ya tiene una clase de prueba registrada."
    ]);
    return;
  }

  echo json_encode([
    "success" => true,
    "existe" => true,
    "yaRegistrado" => false,
    "idalumno" => $idalumno,
    "nombre" => $alumno['nombre_completo'],
    "mensaje" => "Alumno encontrado. Puede agendar clase de prueba."
  ]);
}

/**
 * REGISTRAR CLASE DE PRUEBA
 * Crea el tutor si es menor, crea el alumno si no existe y registra la clase de prueba
 */
function registrarClasePrueba(mysqli $conn): void {
  $data = json_decode(file_get_contents("php://input"), true) ?? [];
  
  $curp = strtoupper(trim($data['curp'] ?? ''));
  $nombre = trim($data['nombre'] ?? '');
  $fechaNacimiento = $data['fechaNacimiento'] ?? '';
  $idhorario = (int)($data['idhorario'] ?? 0);
  $fechaClase = $data['fechaClase'] ?? '';
  
  // Datos del tutor (opcionales, solo si es menor)
  $esMenor = $data['esMenor'] ?? false;
  $nombreTutor = trim($data['nombreTutor'] ?? '');
  $curpTutor = strtoupper(trim($data['curpTutor'] ?? ''));
  $telefonoTutor = trim($data['telefonoTutor'] ?? '');
  $correoTutor = trim($data['correoTutor'] ?? '');

  // Validaciones básicas
  if (empty($curp) || empty($nombre) || empty($fechaNacimiento) || $idhorario <= 0 || empty($fechaClase)) {
    echo json_encode([
      "success" => false,
      "error"   => "Todos los campos obligatorios son requeridos"
    ]);
    return;
  }

  // Validar datos del tutor si es menor
  if ($esMenor) {
    if (empty($nombreTutor) || empty($curpTutor) || empty($telefonoTutor) || empty($correoTutor)) {
      echo json_encode([
        "success" => false,
        "error"   => "Los datos del tutor son requeridos para menores de edad"
      ]);
      return;
    }
  }

  $conn->begin_transaction();

  try {
    $idtutor = null;

    // Si es menor, crear o buscar tutor
    if ($esMenor) {
      // Verificar si ya existe el tutor por CURP
      $sqlCheckTutor = "SELECT idtutor FROM tutores WHERE UPPER(curp) = ?";
      $stmtCheckTutor = $conn->prepare($sqlCheckTutor);
      $stmtCheckTutor->bind_param("s", $curpTutor);
      $stmtCheckTutor->execute();
      $resultTutor = $stmtCheckTutor->get_result();

      if ($resultTutor->num_rows > 0) {
        $rowTutor = $resultTutor->fetch_assoc();
        $idtutor = $rowTutor['idtutor'];
      } else {
        // Crear nuevo tutor
        $sqlInsertTutor = "INSERT INTO tutores (nombre_completo, curp, telefono, correo, estado_documentos) 
                           VALUES (?, ?, ?, ?, 'Incompleto')";
        $stmtInsertTutor = $conn->prepare($sqlInsertTutor);
        $stmtInsertTutor->bind_param("ssss", $nombreTutor, $curpTutor, $telefonoTutor, $correoTutor);
        
        if (!$stmtInsertTutor->execute()) {
          throw new Exception("Error al crear tutor: " . $stmtInsertTutor->error);
        }
        
        $idtutor = $stmtInsertTutor->insert_id;
      }
    }

    // Verificar si ya existe el alumno
    $sql = "SELECT idalumno FROM alumnos WHERE UPPER(curp) = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $curp);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
      $row = $result->fetch_assoc();
      $idalumno = $row['idalumno'];
    } else {
      // Crear nuevo alumno
      if ($esMenor && $idtutor) {
        $sqlInsert = "INSERT INTO alumnos (idtutor, curp, nombre_completo, f_nacimiento, estado) 
                      VALUES (?, ?, ?, ?, 'Activo')";
        $stmtInsert = $conn->prepare($sqlInsert);
        $stmtInsert->bind_param("isss", $idtutor, $curp, $nombre, $fechaNacimiento);
      } else {
        $sqlInsert = "INSERT INTO alumnos (curp, nombre_completo, f_nacimiento, estado) 
                      VALUES (?, ?, ?, 'Activo')";
        $stmtInsert = $conn->prepare($sqlInsert);
        $stmtInsert->bind_param("sss", $curp, $nombre, $fechaNacimiento);
      }
      
      if (!$stmtInsert->execute()) {
        throw new Exception("Error al crear alumno: " . $stmtInsert->error);
      }
      
      $idalumno = $stmtInsert->insert_id;
    }

    // Verificar que no tenga clase de prueba ya registrada
    $sqlCheck = "SELECT idclase_prueba FROM clase_prueba WHERE idalumno = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $idalumno);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();

    if ($resultCheck->num_rows > 0) {
      throw new Exception("Este alumno ya tiene una clase de prueba registrada");
    }

    // Registrar clase de prueba
    $sqlClase = "INSERT INTO clase_prueba (idalumno, idhorario, fecha_clase, estado) 
                 VALUES (?, ?, ?, 'Programada')";
    $stmtClase = $conn->prepare($sqlClase);
    $stmtClase->bind_param("iis", $idalumno, $idhorario, $fechaClase);

    if (!$stmtClase->execute()) {
      throw new Exception("Error al registrar clase de prueba: " . $stmtClase->error);
    }

    $conn->commit();

    echo json_encode([
      "success" => true,
      "mensaje" => "Clase de prueba registrada exitosamente",
      "idclase_prueba" => $stmtClase->insert_id
    ]);

  } catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
      "success" => false,
      "error"   => $e->getMessage()
    ]);
  }
}
?>