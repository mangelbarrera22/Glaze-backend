const db = require("../config/db");

// 1. OBTENER ESTADÍSTICAS (Piezas y Total Dinero)
const getEstadisticasVendedor = (req, res) => {
  // Validación de seguridad para obtener el ID del token
  const vendedorId = req.user ? req.user.id : (req.usuario ? req.usuario.id : null);

  if (!vendedorId) {
    return res.status(401).json({ ok: false, msg: "Token no válido o usuario no identificado" });
  }

  // Consulta 1: Contar piezas disponibles
  // CORRECCIÓN: Se cambió vendedorId por id_vendedor
  const sqlPiezas = "SELECT COUNT(*) AS piezasActivas FROM productos WHERE id_vendedor = ? AND estado = 'disponible'";
  
  db.query(sqlPiezas, [vendedorId], (err, resPiezas) => {
    if (err) {
      console.error("Error SQL en piezas:", err.sqlMessage || err);
      return res.status(500).json({ ok: false, msg: "Error al consultar inventario" });
    }

    // Consulta 2: Sumar ventas realizadas
    const sqlVentas = "SELECT SUM(valor_compra) AS totalVentas FROM ventas WHERE id_vendedor = ?";
    
    db.query(sqlVentas, [vendedorId], (err2, resVentas) => {
      if (err2) {
        console.error("Error SQL en ventas:", err2.sqlMessage || err2);
        return res.status(500).json({ ok: false, msg: "Error al calcular volumen de ventas" });
      }

      // Enviamos la respuesta al Dashboard
      res.json({
        ok: true,
        piezasActivas: resPiezas[0].piezasActivas || 0,
        totalVentas: resVentas[0].totalVentas || 0
      });
    });
  });
};

// 2. OBTENER LISTA DE PRODUCTOS (Para el inventario detallado)
const getMisProductos = (req, res) => {
  const vendedorId = req.user ? req.user.id : (req.usuario ? req.usuario.id : null);

  if (!vendedorId) {
    return res.status(401).json({ ok: false, msg: "Usuario no autorizado" });
  }

  // CORRECCIÓN: Se cambió vendedorId por id_vendedor
  // También cambiamos createdAt por id o la columna de fecha que tengas
  const sql = "SELECT * FROM productos WHERE id_vendedor = ? ORDER BY id DESC";

  db.query(sql, [vendedorId], (err, productos) => {
    if (err) {
      console.error("Error SQL al obtener productos:", err.sqlMessage || err);
      return res.status(500).json({ ok: false, msg: "Error al obtener inventario detallado" });
    }

    res.json({
      ok: true,
      productos: productos 
    });
  });
};

module.exports = {
  getEstadisticasVendedor,
  getMisProductos
};