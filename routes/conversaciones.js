const express = require("express");
const router = express.Router();
const mensajesController = require("../controllers/mensajesController");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, mensajesController.crearConversacion);
router.get("/", authMiddleware, mensajesController.verConversaciones);

module.exports = router;        