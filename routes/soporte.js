const express = require("express");
const router = express.Router();

const soporteController = require("../controllers/soporteController");


// ==========================
// ENVIAR MENSAJE DE SOPORTE
// ==========================
router.post("/", soporteController.enviarMensaje);


// ==========================
// (OPCIONAL) VER MENSAJES POR USUARIO
// ==========================
router.get("/:id_usuario", soporteController.obtenerMensajesUsuario);


// ==========================
// (OPCIONAL) VER TODOS (ADMIN)
// ==========================
router.get("/", soporteController.obtenerTodos);


// ==========================
// (OPCIONAL) ELIMINAR MENSAJE
// ==========================
router.delete("/:id", soporteController.eliminarMensaje);


module.exports = router;