const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productosController");
const upload = require("../config/upload");
const auth = require("../middleware/auth");

// 🔍 Obtener todos
router.get("/", productosController.getProductos);

// ✅ Obtener productos de un vendedor específico
router.get("/vendedor/:id_usuario", auth, productosController.getProductosPorVendedor);

// 🔍 Obtener uno
router.get("/:id", productosController.getProductoById);

// 🔥 CREAR
router.post(
  "/",
  auth,
  upload.fields([
    { name: "imagen", maxCount: 1 },
    { name: "certificado", maxCount: 1 }
  ]),
  productosController.crearProducto
);

// ✏️ ACTUALIZAR (Corregido: Una sola declaración con middlewares)
router.put(
  "/:id",
  auth,
  upload.fields([{ name: "imagen", maxCount: 1 }]), 
  productosController.actualizarProducto
);

// ❌ Eliminar
router.delete("/:id", auth, productosController.eliminarProducto);

module.exports = router;