const crypto = require('crypto');

const verificarFirmaWompi = (req, res, next) => {
  try {
    const checksum = req.headers['x-event-checksum'];
    if (!checksum) {
      return res.status(401).json({ error: 'Firma de evento ausente' });
    }

    const { timestamp, data } = req.body || {};
    const transaction = data?.transaction;

    // Validar que la estructura mínima del evento exista
    if (!timestamp || !transaction || !transaction.id || !transaction.status || transaction.amount_in_cents === undefined) {
      return res.status(400).json({ error: 'Estructura de evento Wompi inválida' });
    }

    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (!eventsSecret) {
      console.error('❌ ERROR CRÍTICO: WOMPI_EVENTS_SECRET no está configurado en el archivo .env');
      return res.status(500).json({ error: 'Error de configuración interna' });
    }

    const { id, status, amount_in_cents } = transaction;

    // Concatenación según la especificación de Webhooks de Wompi:
    // transaction.id + transaction.status + transaction.amount_in_cents + timestamp + WOMPI_EVENTS_SECRET
    const cadena = `${id}${status}${amount_in_cents}${timestamp}${eventsSecret}`;

    const hashCalculado = crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex');

    // Comparación segura en tiempo constante contra Timing Attacks
    const bufferCalculado = Buffer.from(hashCalculado, 'utf8');
    const bufferRecibido = Buffer.from(checksum, 'utf8');

    if (bufferCalculado.length !== bufferRecibido.length || !crypto.timingSafeEqual(bufferCalculado, bufferRecibido)) {
      console.warn('❌ Firma de evento Webhook Wompi inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    next();
  } catch (error) {
    console.error('❌ Error no controlado al verificar firma Wompi:', error);
    res.status(500).json({ error: 'Error al procesar la verificación del evento' });
  }
};

module.exports = verificarFirmaWompi;