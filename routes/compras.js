const express = require("express");
const router = express.Router();

const comprasController = require("../controllers/comprasController");

// ✅ RUTAS
router.post("/comprar", comprasController.comprarProducto);
router.get("/mis-compras/:id_usuario", comprasController.getMisCompras);
router.get("/historial/:id_usuario", comprasController.historialCompras); // 🔥 FIX

module.exports = router;