const db = require("../config/db");

// Helper para promisificar consultas a la base de datos
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ==========================
// 📦 GET TODOS LOS PRODUCTOS
// ==========================
const getProductos = async (req, res) => {
  try {
    const rows = await queryAsync("SELECT * FROM productos ORDER BY id_producto DESC");
    res.json(rows);
  } catch (err) {
    console.error("ERROR PRODUCTOS:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// ==========================
// 🔍 GET PRODUCTO POR ID
// ==========================
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p.*,
        j.tiene_esmeralda,
        j.oro,
        j.oro_rosado,
        j.plata,
        CONCAT_WS(' ', u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido) AS nombre_vendedor
      FROM productos p
      LEFT JOIN joyas j ON p.id_producto = j.id_producto
      LEFT JOIN usuarios u ON p.id_vendedor = u.id_usuario
      WHERE p.id_producto = ?
    `;

    const rows = await queryAsync(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR PRODUCTO:", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

// ==========================
// ➕ CREAR PRODUCTO (Recibe URLs directas desde la App)
// ==========================
const crearProducto = async (req, res) => {
  try {
    console.log("====================================");
    console.log("📦 JSON REQ.BODY RECIBIDO:", req.body);
    console.log("====================================");

    const {
      tipo_producto,
      color,
      peso,
      valor,
      tratamiento,
      stock,
      imagen,      // URL de Cloudinary enviada como texto
      certificado, // URL del certificado enviada como texto (opcional)
      tiene_esmeralda,
      oro,
      oro_rosado,
      plata,
      fecha_ingreso
    } = req.body;

    const id_vendedor = req.user.id || req.user.id_usuario;

    await queryAsync("START TRANSACTION");

    const sqlProducto = `
      INSERT INTO productos 
        (tipo_producto, color, peso, tratamiento, valor, imagen, certificado, stock, id_vendedor, fecha_ingreso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await queryAsync(sqlProducto, [
      tipo_producto,
      color,
      peso,
      tratamiento,
      valor,
      imagen || null,
      certificado || null,
      stock || 1,
      id_vendedor,
      fecha_ingreso || new Date()
    ]);

    const id_producto = result.insertId;

    if (tipo_producto === "joya") {
      const sqlJoya = `INSERT INTO joyas (id_producto, tiene_esmeralda, oro, oro_rosado, plata) VALUES (?, ?, ?, ?, ?)`;
      await queryAsync(sqlJoya, [
        id_producto,
        tiene_esmeralda == "1" || tiene_esmeralda == true ? 1 : 0,
        oro == "1" || oro == true ? 1 : 0,
        oro_rosado == "1" || oro_rosado == true ? 1 : 0,
        plata == "1" || plata == true ? 1 : 0
      ]);
    }

    await queryAsync("COMMIT");

    res.status(201).json({
      ok: true,
      mensaje: tipo_producto === "joya" ? "Joya creada correctamente 🔥" : "Producto creado correctamente 🔥",
      id_producto
    });
  } catch (err) {
    await queryAsync("ROLLBACK");
    console.error("ERROR CREAR PRODUCTO:", err);
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

// ==========================
// ✏️ ACTUALIZAR PRODUCTO
// ==========================
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const id_vendedor = req.user.id || req.user.id_usuario;
    const body = req.body || {};

    const prodExistente = await queryAsync("SELECT id_vendedor, tipo_producto FROM productos WHERE id_producto = ?", [id]);

    if (prodExistente.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (prodExistente[0].id_vendedor !== id_vendedor) {
      return res.status(403).json({ error: "No tienes permiso para modificar este producto" });
    }

    const tipo_actual = prodExistente[0].tipo_producto;

    const campos = [];
    const params = [];

    if (body.color !== undefined) { campos.push("color = ?"); params.push(body.color); }
    if (body.peso !== undefined) { campos.push("peso = ?"); params.push(body.peso); }
    if (body.tratamiento !== undefined) { campos.push("tratamiento = ?"); params.push(body.tratamiento); }
    if (body.valor !== undefined) { campos.push("valor = ?"); params.push(body.valor); }
    if (body.stock !== undefined) { campos.push("stock = ?"); params.push(body.stock); }
    if (body.imagen !== undefined) { campos.push("imagen = ?"); params.push(body.imagen); }
    if (body.certificado !== undefined) { campos.push("certificado = ?"); params.push(body.certificado); }

    await queryAsync("START TRANSACTION");

    if (campos.length > 0) {
      const sql = `UPDATE productos SET ${campos.join(", ")} WHERE id_producto = ?`;
      params.push(id);
      await queryAsync(sql, params);
    }

    if (tipo_actual === "joya") {
      const sqlJoya = `
        UPDATE joyas 
        SET tiene_esmeralda = ?, oro = ?, oro_rosado = ?, plata = ? 
        WHERE id_producto = ?
      `;
      await queryAsync(sqlJoya, [
        body.tiene_esmeralda == "1" || body.tiene_esmeralda == true ? 1 : 0,
        body.oro == "1" || body.oro == true ? 1 : 0,
        body.oro_rosado == "1" || body.oro_rosado == true ? 1 : 0,
        body.plata == "1" || body.plata == true ? 1 : 0,
        id
      ]);
    }

    await queryAsync("COMMIT");

    res.json({ ok: true, mensaje: "Producto actualizado correctamente 💎" });
  } catch (err) {
    await queryAsync("ROLLBACK");
    console.error("ERROR SQL UPDATE:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

// ==========================
// ❌ ELIMINAR PRODUCTO
// ==========================
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const id_vendedor = req.user.id || req.user.id_usuario;

    const prodExistente = await queryAsync("SELECT id_vendedor FROM productos WHERE id_producto = ?", [id]);

    if (prodExistente.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (prodExistente[0].id_vendedor !== id_vendedor) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }

    await queryAsync("DELETE FROM productos WHERE id_producto = ?", [id]);

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("ERROR ELIMINAR:", err);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({ error: "No se puede eliminar el producto porque ya posee historial o transacciones asociadas" });
    }
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};

// ==========================
// 📊 PRODUCTOS POR VENDEDOR
// ==========================
const getProductosPorVendedor = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const rows = await queryAsync(
      "SELECT * FROM productos WHERE id_vendedor = ? ORDER BY id_producto DESC",
      [id_usuario]
    );
    res.json(rows);
  } catch (err) {
    console.error("ERROR VENDEDOR:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

module.exports = {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  getProductosPorVendedor
};