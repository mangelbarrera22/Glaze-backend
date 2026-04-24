const db = require("../config/db");

const getEstadisticas = (req, res) => {
  try {
    const userId = req.user.id;

    // TOTAL COMPRAS
    db.query(
      "SELECT COUNT(*) AS totalCompras FROM ventas WHERE id_comprador = ?",
      [userId],
      (err, comprasResult) => {
        if (err) {
          console.log("Error compras:", err);
          return res.status(500).json(err);
        }

        // GASTO TOTAL
        db.query(
          "SELECT SUM(valor_compra) AS gastoTotal FROM ventas WHERE id_comprador = ?",
          [userId],
          (err2, gastoResult) => {
            if (err2) {
              console.log("Error gasto:", err2);
              return res.status(500).json(err2);
            }

            res.json({
              totalCompras: comprasResult[0].totalCompras || 0,
              gastoTotal: gastoResult[0].gastoTotal || 0
            });
          }
        );
      }
    );

  } catch (error) {
    console.log("ERROR DASHBOARD:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

module.exports = { getEstadisticas };