const db = require("../config/db");

/**
 * Obtiene el resumen de compras y gasto total del usuario autenticado
 */
const getEstadisticas = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.id_usuario;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "Usuario no autenticado o token inválido"
      });
    }

    // Consulta unificada para obtener total de compras y gasto total en un solo llamado
    const sql = `
      SELECT 
        COUNT(*) AS totalCompras,
        COALESCE(SUM(valor_compra), 0) AS gastoTotal
      FROM ventas 
      WHERE id_comprador = ?
    `;

    const [rows] = await db.promise().query(sql, [userId]);

    return res.json({
      ok: true,
      totalCompras: Number(rows[0].totalCompras) || 0,
      gastoTotal: Number(rows[0].gastoTotal) || 0
    });

  } catch (error) {
    console.error("❌ ERROR DASHBOARD:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor al procesar las estadísticas" 
    });
  }
};

module.exports = { 
  getEstadisticas 
};