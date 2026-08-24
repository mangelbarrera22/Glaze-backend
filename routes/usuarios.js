const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const authMiddleware = require("../middleware/auth");
const db = require("../config/db");

// ==========================================
// 👤 PERFIL Y CREDENCIALES GLAZE
// ==========================================

// 🔍 Obtener información del usuario
router.get("/:id", authMiddleware, usuarioController.obtenerUsuario);

// ✏️ Actualizar datos personales (correo, celular, dirección)
router.put("/actualizar/:id", authMiddleware, usuarioController.actualizarUsuario);

// 🔑 Cambio de contraseña con Bcrypt
router.put("/password/:id", authMiddleware, usuarioController.cambiarPassword);

// ==========================================
// 📊 ESTADÍSTICAS (Bóveda de Inversión)
// ==========================================
router.get("/estadisticas/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      COUNT(*) as total_piezas, 
      IFNULL(SUM(valor_compra), 0) as inversion_total 
    FROM ventas 
    WHERE id_comprador = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error en Bóveda:", err);
      return res.status(500).json({ mensaje: "Error al consultar la bóveda" });
    }
    res.json(result[0]);
  });
});

module.exports = router;