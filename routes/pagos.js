const express = require('express');
const router = express.Router();
const { iniciarPago, recibirWebhook, consultarEstado } = require('../controllers/pagosController');
const verificarFirmaWompi = require('../middleware/wompiWebhook');
const authMiddleware = require('../middleware/auth');

router.post('/iniciar', authMiddleware, iniciarPago);
router.post('/webhook', verificarFirmaWompi, recibirWebhook);
router.get('/estado/:referencia', authMiddleware, consultarEstado);

module.exports = router;