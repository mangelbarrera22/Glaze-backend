const express = require("express");
const router = express.Router();
const favoritosController = require("../controllers/favoritosController");
const auth = require("../middleware/auth"); // Importar middleware de autenticación

// Proteger todas las rutas de favoritos
router.post("/", auth, favoritosController.agregarFavorito);
router.get("/:id_usuario", auth, favoritosController.verFavoritos);
router.delete("/:id_usuario/:id_producto", auth, favoritosController.eliminarFavorito);

module.exports = router;