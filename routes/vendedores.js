const { Router } = require("express");
const router = Router();
const { getEstadisticasVendedor, getMisProductos } = require("../controllers/vendedoresController");
const authMiddleware = require("../middleware/auth");

// ==========================================
// 💎 GESTIÓN DE VENDEDORES GLAZE
// ==========================================

// 📊 Estadísticas de ventas e ingresos del vendedor
router.get("/stats", authMiddleware, getEstadisticasVendedor);

// 💎 Inventario de productos asignados al vendedor
router.get("/inventario", authMiddleware, getMisProductos);

module.exports = router;