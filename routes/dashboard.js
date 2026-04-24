// routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

router.get("/estadisticas", auth, (req, res) => {
  const userId = req.user.id;

  // 🧾 TOTAL COMPRAS
  db.query(
    "SELECT COUNT(*) AS total FROM ventas WHERE id_comprador = ?",
    [userId],
    (err, comprasResult) => {
      if (err) {
        console.error("Error compras:", err);
        return res.status(500).json({ error: "Error en compras" });
      }

      // 💰 GASTO TOTAL
      db.query(
        "SELECT SUM(valor_compra) AS total FROM ventas WHERE id_comprador = ?",
        [userId],
        (err2, gastoResult) => {
          if (err2) {
            console.error("Error gasto:", err2);
            return res.status(500).json({ error: "Error en gasto" });
          }

          res.json({
            totalCompras: comprasResult[0].total || 0,
            gastoTotal: gastoResult[0].total || 0
          });
        }
      );
    }
  );
});

module.exports = router;