const express = require("express");
const router = express.Router();

const ventasController = require("../controllers/ventasController");

// 🔥 DEBUG (pon esto una vez)
console.log("ventasController:", ventasController);

// ✅ RUTAS
router.post("/", ventasController.crearVenta);
router.get("/historial/:id_usuario", ventasController.historialCompras);

// 🆕 NUEVA RUTA
router.get("/vendedor/:id_usuario", ventasController.ventasPorVendedor);

module.exports = router;