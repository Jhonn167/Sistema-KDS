const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');
const excel = require('exceljs');

const router = express.Router();

// Middleware para asegurar que solo los admins accedan a los reportes
router.use(checkAuth, (req, res, next) => {
    if (req.userData.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    next();
});

// --- RUTA: RESUMEN DE VENTAS DEL DÍA (CORREGIDA) ---
router.get('/sales-summary', async (req, res) => {
    try {
        // CAMBIO: Ahora contamos todos los pedidos que NO están 'Esperando Pago'.
        const query = `
            SELECT 
                COUNT(*) AS numero_pedidos,
                SUM(total) AS ingresos_totales
            FROM pedidos
            WHERE fecha::date = CURRENT_DATE AND estatus != 'Esperando Pago';
        `;
        const { rows } = await pool.query(query);
        const summary = {
            numero_pedidos: parseInt(rows[0].numero_pedidos) || 0,
            ingresos_totales: parseFloat(rows[0].ingresos_totales) || 0
        };
        res.status(200).json(summary);
    } catch (error) {
        console.error("Error al obtener el resumen de ventas:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- RUTA: PRODUCTOS MÁS VENDIDOS (HOY) (CORREGIDA) ---
router.get('/top-products', async (req, res) => {
    try {
        // CAMBIO: Ahora contamos todos los pedidos que NO están 'Esperando Pago'.
        const query = `
            SELECT 
                pr.nombre,
                SUM(dp.cantidad) AS cantidad_vendida
            FROM detalles_pedido dp
            JOIN productos pr ON dp.producto_id = pr.id_producto
            JOIN pedidos p ON dp.pedido_id = p.id_pedido
            WHERE p.fecha::date = CURRENT_DATE AND p.estatus != 'Esperando Pago'
            GROUP BY pr.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener los productos más vendidos:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- RUTA: CERRAR EL DÍA (se mantiene igual) ---
router.post('/close-day', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const today = new Date().toISOString().slice(0, 10);
        const checkQuery = 'SELECT * FROM cierres_diarios WHERE fecha = $1';
        const checkResult = await client.query(checkQuery, [today]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: 'El cierre del día de hoy ya ha sido realizado.' });
        }
        const summaryQuery = `
            SELECT COUNT(*) AS total_pedidos, SUM(total) AS total_ingresos
            FROM pedidos
            WHERE fecha::date = CURRENT_DATE AND estatus != 'Esperando Pago'; -- Usamos la misma lógica aquí
        `;
        const summaryResult = await client.query(summaryQuery);
        const { total_pedidos, total_ingresos } = summaryResult.rows[0];
        const insertQuery = `
            INSERT INTO cierres_diarios (fecha, ingresos_totales, pedidos_completados)
            VALUES ($1, $2, $3);
        `;
        await client.query(insertQuery, [today, total_ingresos || 0, total_pedidos || 0]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Cierre del día guardado exitosamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al realizar el cierre del día:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    } finally {
        client.release();
    }
});

// --- RUTA: EXPORTAR A EXCEL (se mantiene igual) ---
router.get('/export-daily', async (req, res) => {
    try {
        const topProductsQuery = `SELECT pr.nombre, SUM(dp.cantidad) AS cantidad_vendida FROM detalles_pedido dp JOIN productos pr ON dp.producto_id = pr.id_producto JOIN pedidos p ON dp.pedido_id = p.id_pedido WHERE p.fecha::date = CURRENT_DATE AND p.estatus != 'Esperando Pago' GROUP BY pr.nombre ORDER BY cantidad_vendida DESC LIMIT 10;`;
        const topProductsResult = await pool.query(topProductsQuery);
        const summaryQuery = `SELECT COUNT(*) AS numero_pedidos, SUM(total) AS ingresos_totales FROM pedidos WHERE fecha::date = CURRENT_DATE AND p.estatus != 'Esperando Pago';`;
        const summaryResult = await pool.query(summaryQuery);
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Ventas');
        worksheet.addRow(['Reporte de Ventas del Día:', new Date().toLocaleDateString()]);
        worksheet.addRow([]);
        worksheet.addRow(['Ingresos Totales', summaryResult.rows[0].ingresos_totales || 0]);
        worksheet.addRow(['Pedidos Completados', summaryResult.rows[0].numero_pedidos || 0]);
        worksheet.addRow([]);
        worksheet.addRow(['Productos Más Vendidos']);
        worksheet.getRow(6).font = { bold: true };
        worksheet.columns = [
            { header: 'Producto', key: 'nombre', width: 30 },
            { header: 'Cantidad Vendida', key: 'cantidad', width: 20 }
        ];
        worksheet.addRows(topProductsResult.rows.map(p => ({ nombre: p.nombre, cantidad: p.cantidad_vendida })));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error al exportar a Excel:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;

