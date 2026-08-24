const db = require("../config/db");

// ==========================================
// AGREGAR FAVORITO
// ==========================================
exports.agregarFavorito = async (req, res) => {
  const { id_usuario, id_producto } = req.body;
  const fecha = new Date();

  // 1. Validación de datos de entrada
  if (!id_usuario || !id_producto) {
    console.log("⚠️ FAVORITOS: Datos incompletos", req.body);
    return res.status(400).json({ error: "Faltan datos (ID Usuario o Producto)" });
  }

  try {
    // 2. Verificar si ya existe para no duplicar
    const sqlCheck = "SELECT id_favorito FROM favoritos WHERE id_usuario = ? AND id_producto = ?";
    const [existentes] = await db.promise().query(sqlCheck, [id_usuario, id_producto]);

    if (existentes.length > 0) {
      return res.status(400).json({ error: "Esta pieza ya está en tus favoritos" });
    }

    // 3. Inserción limpia
    const sqlInsert = "INSERT INTO favoritos (id_usuario, id_producto, fecha) VALUES (?, ?, ?)";
    const [result] = await db.promise().query(sqlInsert, [id_usuario, id_producto, fecha]);

    console.log(`✅ FAVORITO GUARDADO: User ${id_usuario} -> Prod ${id_producto}`);
    return res.json({ 
      mensaje: "Producto agregado correctamente", 
      id_favorito: result.insertId 
    });

  } catch (err) {
    console.error("❌ Error en agregarFavorito:", err);
    return res.status(500).json({ error: "Error interno al gestionar favorito" });
  }
};

// ==========================================
// VER FAVORITOS (CON INFORMACIÓN DE PRODUCTO)
// ==========================================
exports.verFavoritos = async (req, res) => {
  const { id_usuario } = req.params;

  if (!id_usuario) {
    return res.status(400).json({ error: "Falta id_usuario" });
  }

  // El JOIN es vital para que la App tenga fotos, precios y nombres al cargar favoritos
  const sql = `
    SELECT 
      f.id_favorito, 
      f.fecha as fecha_agregado,
      p.* 
    FROM favoritos f
    JOIN productos p ON f.id_producto = p.id_producto
    WHERE f.id_usuario = ?
    ORDER BY f.fecha DESC
  `;

  try {
    const [favoritos] = await db.promise().query(sql, [id_usuario]);

    console.log(`📂 Enviando ${favoritos.length} piezas al usuario ${id_usuario}`);
    return res.json(favoritos);

  } catch (err) {
    console.error("❌ Error obteniendo favoritos:", err);
    return res.status(500).json({ error: "Error al cargar la selección personal" });
  }
};

// ==========================================
// ELIMINAR FAVORITO (POR ID ÚNICO 🗑️)
// ==========================================
exports.eliminarFavorito = async (req, res) => {
  const { id_usuario, id_producto } = req.params;

  if (!id_usuario || !id_producto) {
    return res.status(400).json({
      error: "Faltan datos."
    });
  }

  const sql = `
    DELETE FROM favoritos
    WHERE id_usuario = ?
      AND id_producto = ?
  `;

  try {
    const [result] = await db.promise().query(sql, [id_usuario, id_producto]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "El favorito no existe."
      });
    }

    console.log(`🗑️ Favorito eliminado: Usuario ${id_usuario} Producto ${id_producto}`);

    return res.json({
      mensaje: "Favorito eliminado correctamente"
    });

  } catch (err) {
    console.error("❌ Error eliminando favorito:", err);
    return res.status(500).json({
      error: "Error interno."
    });
  }
};