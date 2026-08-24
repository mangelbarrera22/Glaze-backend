const db = require("../config/db");

// Helper para promisificar consultas utilizando la conexión/pool activo
const queryAsync = (conn, sql, params) => {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Helper flexible para extraer el ID del usuario del middleware
const getAuthUserId = (req) => {
  const u = req.user || req.usuario;
  return u?.id_usuario || u?.id || u?.id_vendedor;
};

// Helper para obtener el rol
const getAuthUserRole = (req) => {
  const u = req.user || req.usuario;
  return u?.rol;
};

// ==========================================
// 1. CREAR VENTA (Transacción ACID)
// ==========================================
exports.crearVenta = async (req, res) => {
  const { id_producto, id_comprador, id_vendedor, valor_compra } = req.body;

  if (!id_producto || !id_comprador || !id_vendedor || !valor_compra) {
    return res.status(400).json({ error: "Faltan datos para registrar la venta" });
  }

  db.getConnection(async (err, connection) => {
    if (err) {
      console.error("❌ Error al obtener conexión del pool:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    try {
      await queryAsync(connection, "START TRANSACTION");

      // 1. Insertar la venta
      const fecha_compra = new Date();
      const sqlVenta = `
        INSERT INTO ventas 
        (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra)
        VALUES (?, ?, ?, ?, ?)
      `;
      const resultVenta = await queryAsync(connection, sqlVenta, [
        id_producto,
        id_comprador,
        id_vendedor,
        fecha_compra,
        valor_compra
      ]);

      // 2. Actualizar estado del producto
      const sqlUpdateProducto = `
        UPDATE productos 
        SET estado = 'vendido', id_comprador = ?, fecha_salida = NOW()
        WHERE id_producto = ?
      `;
      await queryAsync(connection, sqlUpdateProducto, [id_comprador, id_producto]);

      // 3. Registrar en historial
      const sqlHistorial = `
        INSERT INTO historial_producto
        (id_producto, id_usuario, evento, descripcion, fecha)
        VALUES (?, ?, ?, ?, NOW())
      `;
      await queryAsync(connection, sqlHistorial, [
        id_producto,
        id_comprador,
        "producto_vendido",
        "Producto comprado por el usuario"
      ]);

      await queryAsync(connection, "COMMIT");

      res.json({
        mensaje: "Venta registrada correctamente",
        id_venta: resultVenta.insertId
      });

    } catch (error) {
      await queryAsync(connection, "ROLLBACK");
      console.error("❌ Error en transacción (crearVenta):", error);
      res.status(500).json({ error: "Error al procesar la venta en la base de datos" });
    } finally {
      connection.release();
    }
  });
};

// ==========================================
// 2. HISTORIAL DE COMPRAS
// ==========================================
exports.historialCompras = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const authId = getAuthUserId(req);
    const rol = getAuthUserRole(req);

    // Verificación de propiedad (Solo el dueño de la cuenta o el Admin pueden consultar)
    if (authId && rol !== "admin" && Number(id_usuario) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para ver este historial" });
    }

    const sql = `
      SELECT 
        v.id_venta,
        v.id_producto,
        v.fecha_compra,
        v.valor_compra,
        CONCAT(p.tipo_producto, ' - ', p.color, ' - ', p.peso, 'ct') AS nombre_producto,
        p.imagen,
        p.valor AS valor_producto
      FROM ventas v
      LEFT JOIN productos p ON v.id_producto = p.id_producto
      WHERE v.id_comprador = ?
      ORDER BY v.fecha_compra DESC
    `;

    const result = await queryAsync(db, sql, [id_usuario]);
    res.json(result);

  } catch (err) {
    console.error("❌ Error historial:", err);
    res.status(500).json({ 
      mensaje: "Error al obtener historial", 
      error: err.message || err 
    });
  }
};

// ==========================================
// 3. VENTAS POR VENDEDOR
// ==========================================
exports.ventasPorVendedor = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const authId = getAuthUserId(req);
    const rol = getAuthUserRole(req);

    // Verificación de propiedad (Solo el vendedor correspondiente o el Admin pueden consultar)
    if (authId && rol !== "admin" && Number(id_usuario) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para ver las ventas de este usuario" });
    }

    const sql = `
      SELECT 
        v.id_venta,
        v.id_producto,
        v.fecha_compra,
        v.valor_compra,
        v.id_comprador,
        CONCAT(p.tipo_producto, ' - ', p.color, ' - ', p.peso, 'ct') AS nombre_producto,
        p.imagen,
        p.valor AS valor_producto
      FROM ventas v
      LEFT JOIN productos p ON v.id_producto = p.id_producto
      WHERE v.id_vendedor = ?
      ORDER BY v.fecha_compra DESC
    `;

    const result = await queryAsync(db, sql, [id_usuario]);
    res.json(result);

  } catch (err) {
    console.error("❌ Error ventas vendedor:", err);
    res.status(500).json({
      mensaje: "Error al obtener ventas del vendedor",
      error: err.message || err
    });
  }
};