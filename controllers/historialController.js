const db = require("../config/db");

exports.obtenerHistorial = (req, res) => {
  // 1. Extraemos el ID que viene de la URL (ej: /api/historial/29)
  const { id_usuario } = req.params;

  console.log("🔍 Buscando adquisiciones para el usuario:", id_usuario);

  // 2. Query ajustada exactamente a tu imagen
  // Nota: Usamos v.id_comprador porque así se llama en tu tabla
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

  db.query(sql, [id_usuario], (err, results) => {
    if (err) {
      console.error("❌ Error SQL en Historial:", err);
      // Enviamos el error para que el frontend deje de cargar y muestre el mensaje
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    // 3. Log de confirmación en tu consola de Node
    console.log(`✅ Se encontraron ${results.length} piezas para el ID ${id_usuario}`);

    // 4. Enviamos los resultados (si no hay, enviará [] y la app mostrará "Vacío")
    res.json(results);
  });
};