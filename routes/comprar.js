const express = require("express");
const router = express.Router();

const comprasController = require("../controllers/comprasController");
const authMiddleware = require("../middleware/auth");

// Middleware de validación básica del cuerpo de la compra
const validarPayloadCompra = (req, res, next) => {
  const { id_producto } = req.body || {};

  if (!id_producto) {
    return res.status(400).json({
      ok: false,
      msg: "El parámetro 'id_producto' es obligatorio para procesar la compra"
    });
  }

  next();
};

// ==========================================
// RUTA DE COMPRA DE PRODUCTO (GLAZE)
// ==========================================
// Requiere JWT válido y un payload con id_producto
router.post(
  "/",
  authMiddleware,
  validarPayloadCompra,
  comprasController.comprarProducto
);

module.exports = router;