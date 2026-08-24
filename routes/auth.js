const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.get("/verificar-usuario/:usuario", authController.verificarUsuario);
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;