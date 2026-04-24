const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const db = require("../config/db");

// ==========================================
// RUTAS DE PERFIL GLAZE (Sincronizadas)
// ==========================================

/**
 * GET /api/usuarios/:id
 * Trae la información del socio, incluyendo el nombre completo concatenado.
 * El frontend debe llamar a: /api/usuarios/${user.id_usuario}
 */
router.get("/:id", usuarioController.obtenerUsuario);

/**
 * PUT /api/usuarios/actualizar/:id
 * Actualiza correo, celular y dirección.
 * El frontend debe llamar a: /api/usuarios/actualizar/${user.id_usuario}
 */
router.put("/actualizar/:id", usuarioController.actualizarUsuario);

/**
 * PUT /api/usuarios/password/:id
 * Cambio de credenciales con validación Bcrypt.
 */
router.put("/password/:id", usuarioController.cambiarPassword);

// ==========================================
// ESTADÍSTICAS (Bóveda de Inversión)
// ==========================================
router.get("/estadisticas/:id", (req, res) => {
  const { id } = req.params;
  
  // Consulta optimizada para la estética de "Inversión Heritage"
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