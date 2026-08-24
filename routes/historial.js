const express = require("express");
const router = express.Router();
const historialController = require("../controllers/historialController");
const auth = require("../middleware/auth"); // Middleware JWT

// Obtener historial del usuario (protegido)
router.get("/:id_usuario", auth, historialController.obtenerHistorial);

module.exports = router;