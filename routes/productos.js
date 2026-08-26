const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productosController");
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

// 🔥 CREAR PRODUCTO (Recibe el JSON limpio con las URLs de Cloudinary)
router.post(
  "/",
  auth,
  productosController.crearProducto
);

// ✏️ ACTUALIZAR PRODUCTO (Recibe el JSON limpio con las URLs de Cloudinary)
router.put(
  "/:id",
  auth,
  productosController.actualizarProducto
);

// ❌ ELIMINAR PRODUCTO
router.delete("/:id", auth, productosController.eliminarProducto);

module.exports = router;