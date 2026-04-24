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

router.post("/certificado/:id_producto", authMiddleware, mintearCertificado);
router.get("/verificar/:id_producto", verificarCertificado);
router.get("/registro/:id_producto", obtenerRegistro);
router.get("/historial", historialBlockchain);
router.get("/producto/:id_producto", obtenerProductoCompleto);

module.exports = router;    