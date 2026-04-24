const express = require("express");
const router = express.Router();
const favoritosController = require("../controllers/favoritosController");

// CAMBIO AQUÍ: Usa "/" en lugar de "/favoritos"
router.post("/", favoritosController.agregarFavorito); 

// CAMBIO AQUÍ: Usa "/:id_usuario" en lugar de "/favoritos/:id_usuario"
router.get("/:id_usuario", favoritosController.verFavoritos);

// CAMBIO AQUÍ: Usa "/:id" en lugar de "/eliminar/:id" (opcional)
router.delete("/:id", favoritosController.eliminarFavorito);

module.exports = router;