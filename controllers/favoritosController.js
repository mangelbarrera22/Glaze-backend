const db = require("../config/db");

// ==========================================
// AGREGAR FAVORITO (CON BLINDAJE 🔥)
// ==========================================
exports.agregarFavorito = (req, res) => {
  const { id_usuario, id_producto } = req.body;
  const fecha = new Date();

  // 1. Validación de datos de entrada
  if (!id_usuario || !id_producto) {
    console.log("⚠️ FAVORITOS: Datos incompletos", req.body);
    return res.status(400).json({ error: "Faltan datos (ID Usuario o Producto)" });
  }

  // 2. Verificar si ya existe para no duplicar
  const sqlCheck = "SELECT id_favorito FROM favoritos WHERE id_usuario = ? AND id_producto = ?";
  
  db.query(sqlCheck, [id_usuario, id_producto], (errCheck, results) => {
    if (errCheck) {
      console.error("❌ Error verificando duplicados:", errCheck);
      return res.status(500).json({ error: "Error interno al verificar favorito" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Esta pieza ya está en tus favoritos" });
    }

    // 3. Inserción limpia
    const sqlInsert = "INSERT INTO favoritos (id_usuario, id_producto, fecha) VALUES (?, ?, ?)";

    db.query(sqlInsert, [id_usuario, id_producto, fecha], (err, result) => {
      if (err) {
        console.error("❌ Error al insertar favorito:", err);
        return res.status(500).json({ error: "No se pudo guardar la selección" });
      }

      console.log(`✅ FAVORITO GUARDADO: User ${id_usuario} -> Prod ${id_producto}`);
      res.json({ 
        mensaje: "Producto agregado correctamente", 
        id_favorito: result.insertId 
      });
    });
  });
};

// ==========================================
// VER FAVORITOS (CON INFORMACIÓN DE PRODUCTO)
// ==========================================
exports.verFavoritos = (req, res) => {
  const { id_usuario } = req.params;

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

  db.query(sql, [id_usuario], (err, result) => {
    if (err) {
      console.error("❌ Error obteniendo favoritos:", err);
      return res.status(500).json({ error: "Error al cargar la selección personal" });
    }

    console.log(`📂 Enviando ${result.length} piezas al usuario ${id_usuario}`);
    res.json(result);
  });
};

// ==========================================
// ELIMINAR FAVORITO (POR ID ÚNICO 🗑️)
// ==========================================
exports.eliminarFavorito = (req, res) => {
  // Recibe el 'id' desde la URL: /api/favoritos/:id
  const { id } = req.params; 

  if (!id) {
    return res.status(400).json({ error: "ID de favorito no proporcionado" });
  }

  const sql = "DELETE FROM favoritos WHERE id_favorito = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error al eliminar favorito:", err);
      return res.status(500).json({ error: "Error interno al intentar eliminar" });
    }

    if (result.affectedRows === 0) {
      console.log(`⚠️ Registro no encontrado para eliminar: ${id}`);
      return res.status(404).json({ error: "El registro no fue encontrado" });
    }

    console.log(`🗑️ FAVORITO ELIMINADO: ID ${id}`);
    res.json({ mensaje: "Selección eliminada correctamente" });
  });
};