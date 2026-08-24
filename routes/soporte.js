const express = require("express");
const router = express.Router();

const soporteController = require("../controllers/soporteController");
const auth = require("../middleware/auth");

// ==========================================
// 📨 ENVIAR MENSAJE DE SOPORTE
// ==========================================
router.post("/", auth, soporteController.enviarMensaje);

// ==========================================
// 📋 VER MENSAJES POR USUARIO
// ==========================================
router.get("/:id_usuario", auth, soporteController.obtenerMensajesUsuario);

// ==========================================
// 🛠️ VER TODOS LOS MENSAJES (ADMIN)
// ==========================================
router.get("/", auth, soporteController.obtenerTodos);

// ==========================================
// ❌ ELIMINAR MENSAJE DE SOPORTE
// ==========================================
router.delete("/:id", auth, soporteController.eliminarMensaje);

module.exports = router;