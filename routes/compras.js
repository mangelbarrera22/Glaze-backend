const express = require("express");
const router = express.Router();

const comprasController = require("../controllers/comprasController");
const authMiddleware = require("../middleware/auth");

// Middleware para verificar datos mínimos al realizar una compra
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
// RUTAS DE COMPRAS Y HISTORIAL (GLAZE)
// ==========================================

// 1. Crear transacción de compra
router.post(
  "/comprar",
  authMiddleware,
  validarPayloadCompra,
  comprasController.comprarProducto
);

// 2. Obtener las compras del usuario autenticado (extrae el ID desde el Token JWT)
router.get(
  "/mis-compras",
  authMiddleware,
  comprasController.getMisCompras
);

// 3. Historial de compras (mantenido por compatibilidad, protegido con JWT)
router.get(
  "/historial",
  authMiddleware,
  comprasController.historialCompras
);

// 4. Endpoint de soporte/admin para consultar historial por usuario específico (opcional)
router.get(
  "/historial/:id_usuario",
  authMiddleware,
  (req, res, next) => {
    // Si el usuario autenticado intenta ver el historial de otro usuario y no es admin, se deniega el acceso
    if (String(req.user.id) !== String(req.params.id_usuario) && req.user.rol !== "admin") {
      return res.status(403).json({
        ok: false,
        msg: "No tiene permisos para consultar las compras de otro usuario"
      });
    }
    next();
  },
  comprasController.historialCompras
);

module.exports = router;