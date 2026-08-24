const express = require('express');
const router = express.Router();
const {
  iniciarPago,
  recibirWebhook,
  consultarEstado
} = require('../controllers/pagosController');
const verificarFirmaWompi = require('../middleware/wompiWebhook');
const authMiddleware = require('../middleware/auth');

// 🔥 INICIAR PAGO
router.post('/iniciar', authMiddleware, iniciarPago);

// 🔥 WEBHOOK WOMPI
router.post('/webhook', verificarFirmaWompi, recibirWebhook);

// 🔥 CONSULTAR ESTADO
router.get('/estado/:referencia', authMiddleware, consultarEstado);

// 🔥 REDIRECCIÓN DESDE WOMPI (DEEP LINKING)
router.get('/pago-resultado', (req, res) => {
  const { id, status } = req.query;

  console.log("🔁 Redirección desde Wompi:", { id, status });

  res.redirect(`emerald-trade://pago-resultado?referencia=${id}&estado=${status}`);
});

module.exports = router;