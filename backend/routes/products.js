// backend/routes/products.js

const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// OBTENER TODOS LOS PRODUCTOS ACTIVOS (Para Menú y POS)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos WHERE activo = TRUE ORDER BY nombre ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("ERROR DETALLADO EN GET /api/products:", error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});


// OBTENER TODOS LOS PRODUCTOS PARA EL PANEL DE ADMIN
router.get('/admin', checkRole(['admin']), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY id_producto ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("ERROR DETALLADO EN GET /api/products/admin:", error);
    res.status(500).json({ message: 'Error al obtener todos los productos para el admin' });
  }
});

// OBTENER UN PRODUCTO POR ID (CON SUS MODIFICADORES)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productQuery = 'SELECT * FROM productos WHERE id_producto = $1';
        const productResult = await pool.query(productQuery, [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        const product = productResult.rows[0];
        const modifiersQuery = `
            SELECT 
                g.id_grupo, g.nombre, g.tipo_seleccion,
                COALESCE(
                    json_agg(json_build_object('id_opcion', o.id_opcion, 'nombre', o.nombre, 'precio_adicional', o.precio_adicional) ORDER BY o.id_opcion ASC) 
                    FILTER (WHERE o.id_opcion IS NOT NULL), '[]'
                ) AS opciones
            FROM producto_modificadores pm
            JOIN modificador_grupos g ON pm.id_grupo = g.id_grupo
            LEFT JOIN modificador_opciones o ON g.id_grupo = o.id_grupo
            WHERE pm.id_producto = $1
            GROUP BY g.id_grupo;
        `;
        const modifiersResult = await pool.query(modifiersQuery, [id]);
        product.modificadores = modifiersResult.rows;
        res.status(200).json(product);
    } catch (error) {
        console.error(`ERROR DETALLADO EN GET /api/products/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
});


// CREAR UN PRODUCTO
router.post('/', checkAuth, async (req, res) => {
  if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = req.body;
    const query = 'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_producto';
    const values = [nombre, descripcion, precio, stock, categoria_id, imagen_url];
    const { rows } = await pool.query(query, values);
    res.status(201).json({ message: 'Producto creado', productId: rows[0].id_producto });
  } catch (error) {
    console.error("ERROR DETALLADO EN POST /api/products:", error);
    res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
});

// ACTUALIZAR UN PRODUCTO
router.put('/:id', checkAuth, async (req, res) => {
   if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = req.body;
    const { id } = req.params;
    const query = 'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, imagen_url = $6 WHERE id_producto = $7';
    const values = [nombre, descripcion, precio, stock, categoria_id, imagen_url, id];
    await pool.query(query, values);
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error(`ERROR DETALLADO EN PUT /api/products/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
  }
});

// ACTUALIZAR EL ESTATUS DE UN PRODUCTO (ACTIVAR/SUSPENDER)
router.patch('/:id/status', checkAuth, async (req, res) => {
  if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ message: 'El estado "activo" debe ser un valor booleano (true/false).' });
    }
    await pool.query(
      'UPDATE productos SET activo = $1 WHERE id_producto = $2',
      [activo, id]
    );
    const action = activo ? 'activado' : 'suspendido';
    res.status(200).json({ message: `Producto ${action} exitosamente` });
  } catch (error) {
    console.error(`ERROR DETALLADO EN PATCH /api/products/${req.params.id}/status:`, error);
    res.status(500).json({ message: 'Error al actualizar el estado del producto', error: error.message });
  }
});


// ELIMINAR UN PRODUCTO
router.delete('/:id', checkAuth, async (req, res) => {
    if (req.userData.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM detalles_pedido WHERE producto_id = $1', [id]);
        const result = await pool.query('DELETE FROM productos WHERE id_producto = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error(`ERROR DETALLADO EN DELETE /api/products/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al eliminar el producto.', error: error.message });
    }
});


// --- RUTA NUEVA: ASIGNAR MODIFICADORES A UN PRODUCTO ---
router.post('/:id/modifiers', checkAuth, async (req, res) => {
    if (req.userData.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { modifierGroupIds } = req.body; // Esperamos un array de IDs [1, 3, 4]

        await client.query('BEGIN');
        
        // Primero, borramos todas las asignaciones existentes para este producto
        await client.query('DELETE FROM producto_modificadores WHERE id_producto = $1', [id]);

        // Luego, si hay nuevos IDs, los insertamos
        if (modifierGroupIds && modifierGroupIds.length > 0) {
            for (const groupId of modifierGroupIds) {
                await client.query(
                    'INSERT INTO producto_modificadores (id_producto, id_grupo) VALUES ($1, $2)',
                    [id, groupId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Modificadores asignados correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`ERROR DETALLADO EN POST /api/products/${req.params.id}/modifiers:`, error);
        res.status(500).json({ message: 'Error al asignar modificadores.' });
    } finally {
        client.release();
    }
});

module.exports = router;
