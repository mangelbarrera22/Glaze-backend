const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");

// Usamos "/" porque el prefijo "/api/comprar" ya viene desde app.js
// Conectamos directamente con la función lógica del controlador
router.post("/", comprasController.comprarProducto);

module.exports = router;