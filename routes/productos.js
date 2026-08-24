const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productosController");
const upload = require("../config/upload");
const auth = require("../middleware/auth");

// 🔍 OBTENER TODOS LOS PRODUCTOS
router.get("/", productosController.getProductos);

// ✅ OBTENER PRODUCTOS DE UN VENDEDOR ESPECÍFICO
router.get(
  "/vendedor/:id_usuario",
  auth,
  productosController.getProductosPorVendedor
);

// 🔍 OBTENER PRODUCTO POR ID
router.get("/:id", productosController.getProductoById);

// 🔥 CREAR PRODUCTO
router.post(
  "/",
  auth,
  upload.fields([
    { name: "imagen", maxCount: 1 },
    { name: "certificado", maxCount: 1 },
  ]),
  productosController.crearProducto
);

// ✏️ ACTUALIZAR PRODUCTO (Solo permite actualizar imagen, el certificado es inmutable)
router.put(
  "/:id",
  auth,
  upload.fields([{ name: "imagen", maxCount: 1 }]),
  productosController.actualizarProducto
);

// ❌ ELIMINAR PRODUCTO
router.delete("/:id", auth, productosController.eliminarProducto);

module.exports = router;