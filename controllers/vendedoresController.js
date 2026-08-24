const db = require("../config/db");

// Helper para promisificar consultas
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Helper para extraer el ID del usuario desde la petición
const getVendedorId = (req) => req.user?.id || req.usuario?.id || req.user?.id_usuario;

// ==========================================
// 📊 OBTENER ESTADÍSTICAS (Piezas y Total Dinero)
// ==========================================
const getEstadisticasVendedor = async (req, res) => {
  try {
    const vendedorId = getVendedorId(req);

    if (!vendedorId) {
      return res.status(401).json({ ok: false, msg: "Token no válido o usuario no identificado" });
    }

    const sqlPiezas = "SELECT COUNT(*) AS piezasActivas FROM productos WHERE id_vendedor = ? AND estado = 'disponible'";
    const sqlVentas = "SELECT SUM(valor_compra) AS totalVentas FROM ventas WHERE id_vendedor = ?";

    // Ejecución paralela de ambas consultas para optimizar el tiempo de respuesta
    const [resPiezas, resVentas] = await Promise.all([
      queryAsync(sqlPiezas, [vendedorId]),
      queryAsync(sqlVentas, [vendedorId])
    ]);

    res.json({
      ok: true,
      piezasActivas: resPiezas[0]?.piezasActivas || 0,
      totalVentas: resVentas[0]?.totalVentas || 0
    });
  } catch (err) {
    console.error("❌ Error SQL (getEstadisticasVendedor):", err.sqlMessage || err);
    res.status(500).json({ ok: false, msg: "Error al calcular métricas del vendedor" });
  }
};

// ==========================================
// 💎 OBTENER LISTA DE PRODUCTOS (Inventario)
// ==========================================
const getMisProductos = async (req, res) => {
  try {
    const vendedorId = getVendedorId(req);

    if (!vendedorId) {
      return res.status(401).json({ ok: false, msg: "Usuario no autorizado" });
    }

    const sql = "SELECT * FROM productos WHERE id_vendedor = ? ORDER BY id DESC";
    const productos = await queryAsync(sql, [vendedorId]);

    res.json({
      ok: true,
      productos
    });
  } catch (err) {
    console.error("❌ Error SQL (getMisProductos):", err.sqlMessage || err);
    res.status(500).json({ ok: false, msg: "Error al obtener inventario detallado" });
  }
};

module.exports = {
  getEstadisticasVendedor,
  getMisProductos
};