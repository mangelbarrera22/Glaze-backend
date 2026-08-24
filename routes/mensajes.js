console.log("✅ Rutas de mensajes cargadas");
const express = require("express");
const router = express.Router();
const mensajesController = require("../controllers/mensajesController");
const authMiddleware = require("../middleware/auth");

router.post("/conversaciones", authMiddleware, mensajesController.crearConversacion);
router.get("/conversaciones", authMiddleware, mensajesController.verConversaciones);

router.post("/", authMiddleware, mensajesController.enviarMensaje);
router.get("/:id_conversacion", authMiddleware, mensajesController.verMensajes);

module.exports = router;