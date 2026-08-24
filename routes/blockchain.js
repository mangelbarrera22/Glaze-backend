const express = require("express");
const router = express.Router();

const { 
  mintearCertificado, 
  verificarCertificado,
  obtenerRegistro,
  historialBlockchain,
  obtenerProductoCompleto
} = require("../controllers/blockchainController");

const authMiddleware = require("../middleware/auth");

// Middleware liviano para validar que id_producto sea un identificador numérico o Hash válido
const validarIdProducto = (req, res, next) => {
  const { id_producto } = req.params;
  
  if (!id_producto || isNaN(Number(id_producto))) {
    return res.status(400).json({ 
      ok: false, 
      msg: "El identificador del producto debe ser un número válido" 
    });
  }
  
  next();
};

// ==========================================
// RUTAS DE BLOCKCHAIN Y TRAZABILIDAD (GLAZE)
// ==========================================

// 1. Mintear Certificado en Blockchain (Requiere Autenticación)
router.post(
  "/certificado/:id_producto", 
  authMiddleware, 
  validarIdProducto, 
  mintearCertificado
);

// 2. Verificar Certificado Público (Acceso Libre para Auditoría)
router.get(
  "/verificar/:id_producto", 
  validarIdProducto, 
  verificarCertificado
);

// 3. Obtener Registro Técnico del Certificado
router.get(
  "/registro/:id_producto", 
  validarIdProducto, 
  obtenerRegistro
);

// 4. Historial Global de Transacciones en Blockchain
router.get(
  "/historial", 
  historialBlockchain
);

// 5. Obtener Detalle Completo del Producto y Trazabilidad (Requiere Autenticación)
router.get(
  "/producto/:id_producto", 
  authMiddleware, 
  validarIdProducto, 
  obtenerProductoCompleto
);

module.exports = router;