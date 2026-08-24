const db = require("../config/db");

exports.obtenerHistorial = async (req, res) => {
  // 1. Extraemos el ID que viene de la URL
  const { id_usuario } = req.params;

  if (!id_usuario) {
    return res.status(400).json({ mensaje: "Falta id_usuario" });
  }

  console.log("🔍 Buscando adquisiciones para el usuario:", id_usuario);

  // 2. Query ajustada
  const sql = `
    SELECT 
      v.id_venta,
      v.id_producto,
      v.fecha_compra, 
      v.valor_compra,
      p.tipo_producto AS nombre_producto, 
      p.color,
      p.peso,
      p.imagen
    FROM ventas v
    JOIN productos p ON v.id_producto = p.id_producto
    WHERE v.id_comprador = ?
    ORDER BY v.fecha_compra DESC
  `;

  try {
    const [results] = await db.promise().query(sql, [id_usuario]);

    // 3. Log de confirmación
    console.log(`✅ Se encontraron ${results.length} piezas para el ID ${id_usuario}`);

    // 4. Enviamos los resultados
    return res.json(results);

  } catch (err) {
    console.error("❌ Error SQL en Historial:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};