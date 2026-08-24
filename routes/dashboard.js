const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");

// ==========================================
// RUTAS DEL DASHBOARD (GLAZE)
// ==========================================

// Obtener estadísticas de compras y gastos del usuario autenticado
router.get(
  "/estadisticas",
  authMiddleware,
  dashboardController.getEstadisticas
);

module.exports = router;