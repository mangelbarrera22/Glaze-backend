const express = require("express");
const router = express.Router();

const historialController = require("../controllers/historialController");

// ✅ SOLO ESTA RUTA (segura)
router.get("/:id_usuario", historialController.obtenerHistorial);

module.exports = router;