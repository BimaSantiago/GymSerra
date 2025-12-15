<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir archivo de conexión
include 'conexion.php';
$conexion = ConcectarBd();
mysqli_set_charset($conexion, "utf8");

try {
    // Estadísticas de alumnos
    $queryAlumnos = "SELECT 
        COUNT(*) as total_alumnos,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as alumnos_activos,
        SUM(CASE WHEN estado = 'Inactivo' THEN 1 ELSE 0 END) as alumnos_inactivos
    FROM alumnos";
    $resultAlumnos = mysqli_query($conexion, $queryAlumnos);
    $alumnos = mysqli_fetch_assoc($resultAlumnos);

    // Estadísticas de mensualidades del mes actual
    $queryMensualidades = "SELECT 
        COUNT(*) as total_mensualidades,
        SUM(CASE WHEN estado = 'Pagado' THEN 1 ELSE 0 END) as mensualidades_pagadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as mensualidades_pendientes,
        SUM(CASE WHEN estado = 'Vencido' THEN 1 ELSE 0 END) as mensualidades_vencidas,
        COALESCE(SUM(CASE WHEN estado = 'Pagado' THEN total_pagado ELSE 0 END), 0) as total_mensualidades_mes
    FROM mensualidad
    WHERE MONTH(fecha_pago) = MONTH(CURRENT_DATE())
    AND YEAR(fecha_pago) = YEAR(CURRENT_DATE())";
    $resultMensualidades = mysqli_query($conexion, $queryMensualidades);
    $mensualidades = mysqli_fetch_assoc($resultMensualidades);

    // Estadísticas de ventas del mes actual
    $queryVentas = "SELECT 
        COALESCE(SUM(total), 0) as total_ventas_mes,
        COUNT(*) as total_transacciones
    FROM movimiento
    WHERE tipo = 'Venta'
    AND MONTH(fecha) = MONTH(CURRENT_DATE())
    AND YEAR(fecha) = YEAR(CURRENT_DATE())";
    $resultVentas = mysqli_query($conexion, $queryVentas);
    $ventas = mysqli_fetch_assoc($resultVentas);

    // Estadísticas de artículos
    $queryArticulos = "SELECT 
        COUNT(*) as total_articulos,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as articulos_activos
    FROM articulos";
    $resultArticulos = mysqli_query($conexion, $queryArticulos);
    $articulos = mysqli_fetch_assoc($resultArticulos);

    // Próximos eventos (30 días)
    $queryEventos = "SELECT COUNT(*) as proximos_eventos
    FROM eventos
    WHERE fecha_inicio >= CURRENT_DATE()
    AND fecha_inicio <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)";
    $resultEventos = mysqli_query($conexion, $queryEventos);
    $eventos = mysqli_fetch_assoc($resultEventos);

    // Alumnos por deporte
    $queryDeportes = "SELECT 
        d.nombre as deporte,
        d.color,
        COUNT(DISTINCT m.idalumno) as total
    FROM deporte d
    LEFT JOIN plan_pago pp ON d.iddeporte = pp.iddeporte
    LEFT JOIN mensualidad m ON pp.idplan = m.idplan
    LEFT JOIN alumnos a ON m.idalumno = a.idalumno AND a.estado = 'Activo'
    WHERE d.nombre != 'Libre'
    GROUP BY d.iddeporte, d.nombre, d.color
    HAVING total > 0
    ORDER BY total DESC";
    $resultDeportes = mysqli_query($conexion, $queryDeportes);
    $alumnosPorDeporte = [];
    while ($row = mysqli_fetch_assoc($resultDeportes)) {
        $alumnosPorDeporte[] = $row;
    }

    // Ventas mensuales (últimos 6 meses)
    $queryVentasMes = "SELECT 
        DATE_FORMAT(fecha, '%b') as mes,
        DATE_FORMAT(fecha, '%Y-%m') as periodo,
        COALESCE(SUM(CASE WHEN tipo = 'Venta' THEN total ELSE 0 END), 0) as ventas
    FROM movimiento
    WHERE fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(fecha, '%Y-%m'), DATE_FORMAT(fecha, '%b')
    ORDER BY periodo ASC";
    $resultVentasMes = mysqli_query($conexion, $queryVentasMes);
    
    $ventasPorMes = [];
    while ($row = mysqli_fetch_assoc($resultVentasMes)) {
        $ventasPorMes[$row['periodo']] = [
            'mes' => $row['mes'],
            'ventas' => floatval($row['ventas']),
            'mensualidades' => 0
        ];
    }

    // Mensualidades por mes (últimos 6 meses)
    $queryMensualidadesMes = "SELECT 
        DATE_FORMAT(fecha_pago, '%Y-%m') as periodo,
        COALESCE(SUM(total_pagado), 0) as mensualidades
    FROM mensualidad
    WHERE fecha_pago >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
    AND estado = 'Pagado'
    GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m')";
    $resultMensualidadesMes = mysqli_query($conexion, $queryMensualidadesMes);
    
    while ($row = mysqli_fetch_assoc($resultMensualidadesMes)) {
        if (isset($ventasPorMes[$row['periodo']])) {
            $ventasPorMes[$row['periodo']]['mensualidades'] = floatval($row['mensualidades']);
        }
    }

    // Convertir a array simple
    $ventasMensuales = array_values($ventasPorMes);

    // Preparar respuesta
    $response = [
        'success' => true,
        'estadisticas' => [
            'total_alumnos' => intval($alumnos['total_alumnos']),
            'alumnos_activos' => intval($alumnos['alumnos_activos']),
            'alumnos_inactivos' => intval($alumnos['alumnos_inactivos']),
            'total_mensualidades_mes' => floatval($mensualidades['total_mensualidades_mes']),
            'mensualidades_pagadas' => intval($mensualidades['mensualidades_pagadas']),
            'mensualidades_pendientes' => intval($mensualidades['mensualidades_pendientes']),
            'mensualidades_vencidas' => intval($mensualidades['mensualidades_vencidas']),
            'total_ventas_mes' => floatval($ventas['total_ventas_mes']),
            'total_articulos' => intval($articulos['total_articulos']),
            'articulos_activos' => intval($articulos['articulos_activos']),
            'proximos_eventos' => intval($eventos['proximos_eventos'])
        ],
        'alumnos_por_deporte' => $alumnosPorDeporte,
        'ventas_mensuales' => $ventasMensuales
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener estadísticas: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Cerrar conexión si es necesario
if (isset($conexion)) {
    mysqli_close($conexion);
}
?>