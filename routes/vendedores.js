const { Router } = require("express");
const router = Router();
const { getEstadisticasVendedor, getMisProductos } = require("../controllers/vendedoresController");


// ✅ POR ESTO (Usando tu middleware de auth actual):
const auth = require("../middleware/auth"); 

// Y aplica el middleware a las rutas así:
router.get("/stats", auth, getEstadisticasVendedor);
router.get("/inventario", auth, getMisProductos);

module.exports = router;