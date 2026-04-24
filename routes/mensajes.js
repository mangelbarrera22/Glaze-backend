const express = require("express");
const router = express.Router();
const mensajesController = require("../controllers/mensajesController");
const authMiddleware = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.post("/conversaciones", authMiddleware, mensajesController.crearConversacion);
router.get("/conversaciones", authMiddleware, mensajesController.verConversaciones);
router.post("/mensajes", authMiddleware, mensajesController.enviarMensaje);
router.get("/mensajes/:id_conversacion", authMiddleware, mensajesController.verMensajes);

module.exports = router;