const crypto = require('crypto');

const verificarFirmaWompi = (req, res, next) => {
  try {
    const checksum = req.headers['x-event-checksum'];
    if (!checksum) {
      return res.status(401).json({ error: 'Firma ausente' });
    }

    const { timestamp, data } = req.body;
    const { id, status, amount_in_cents } = data.transaction;

    // Wompi firma así: transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret
    const cadena = `${id}${status}${amount_in_cents}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`;
    const hashEsperado = crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex');

    if (hashEsperado !== checksum) {
      console.log('❌ Firma inválida');
      console.log('Esperada:', hashEsperado);
      console.log('Recibida:', checksum);
      return res.status(401).json({ error: 'Firma inválida' });
    }

    next();
  } catch (error) {
    console.error('Error verificando firma:', error);
    res.status(500).json({ error: 'Error verificando firma' });
  }
};

module.exports = verificarFirmaWompi;