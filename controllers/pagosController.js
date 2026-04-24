const db = require('../config/db');
const crypto = require('crypto');
const { registrarTransaccion } = require('./blockchainController');

const generarReferencia = () => {
  return `GLAZE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const generarFirmaIntegridad = (referencia, montoCentavos, moneda) => {
  const cadena = `${referencia}${montoCentavos}${moneda}${process.env.WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
};

// POST /api/pagos/iniciar
const iniciarPago = (req, res) => {
  const { id_producto, id_vendedor } = req.body;
  const id_comprador = req.user.id || req.user.id_usuario;

  if (!id_producto || !id_vendedor) {
    return res.status(400).json({ error: 'id_producto e id_vendedor son requeridos' });
  }

  db.query(
    'SELECT valor, estado FROM productos WHERE id_producto = ?',
    [id_producto],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error interno' });
      if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      if (rows[0].estado !== 'disponible') return res.status(400).json({ error: 'Producto no disponible' });

      const monto = parseFloat(rows[0].valor);
      const montoCentavos = Math.round(monto * 100);
      const referencia = generarReferencia();
      const firma = generarFirmaIntegridad(referencia, montoCentavos, 'COP');

      const insertQuery = `
        INSERT INTO transacciones 
          (referencia, id_producto, id_comprador, id_vendedor, monto_centavos, estado)
        VALUES (?, ?, ?, ?, ?, 'PENDIENTE')
      `;

      db.query(insertQuery, [referencia, id_producto, id_comprador, id_vendedor, montoCentavos], (insertErr, result) => {
        if (insertErr) {
          console.error('Error guardando transacción:', insertErr);
          return res.status(500).json({ error: 'Error interno' });
        }

        const urlPago = `https://checkout.wompi.co/p/?public-key=${process.env.WOMPI_PUBLIC_KEY}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}&signature:integrity=${firma}&redirect-url=${encodeURIComponent(process.env.WOMPI_REDIRECT_URL)}`;

        res.json({
          transaccionId: result.insertId,
          referencia,
          monto,
          urlPago
        });
      });
    }
  );
};

// POST /api/pagos/webhook
const recibirWebhook = (req, res) => {
  const { event, data } = req.body;

  if (event !== 'transaction.updated') {
    return res.status(200).json({ received: true });
  }

  const { transaction } = data;
  const { reference, status, payment_method_type, id: wompiId } = transaction;

  const estadoMap = {
    'APPROVED': 'APROBADO',
    'DECLINED': 'RECHAZADO',
    'VOIDED':   'ANULADO',
    'ERROR':    'RECHAZADO'
  };

  const nuevoEstado = estadoMap[status] || 'PENDIENTE';

  const updateQuery = `
    UPDATE transacciones 
    SET estado = ?, metodo_pago = ?, wompi_id = ?
    WHERE referencia = ?
  `;

  db.query(updateQuery, [nuevoEstado, payment_method_type, wompiId, reference], (err) => {
    if (err) {
      console.error('Error en webhook:', err);
      return res.status(500).json({ error: 'Error interno' });
    }

    if (nuevoEstado === 'APROBADO') {
      db.query(
        'SELECT id_producto, id_comprador, id_vendedor, monto_centavos FROM transacciones WHERE referencia = ?',
        [reference],
         async (selectErr, rows) => {
          if (selectErr || rows.length === 0) return;

          const { id_producto, id_comprador, id_vendedor, monto_centavos } = rows[0];
          const valor = monto_centavos / 100;

          db.query(
            `INSERT INTO ventas (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra)
             VALUES (?, ?, ?, CURDATE(), ?)`,
            [id_producto, id_comprador, id_vendedor, valor],
            (ventaErr) => {
              if (ventaErr) console.error('Error insertando venta:', ventaErr);
            }
          );

          db.query(
            `UPDATE productos SET estado = 'vendido', id_comprador = ? WHERE id_producto = ?`,
            [id_comprador, id_producto],
            (prodErr) => {
              if (prodErr) console.error('Error actualizando producto:', prodErr);
            }
          );

          db.query(
            `INSERT INTO historial_producto (id_producto, id_usuario, evento, descripcion, fecha)
             VALUES (?, ?, 'producto_comprado', ?, NOW())`,
            [id_producto, id_comprador, `Compra exitosa por valor de $${valor.toFixed(2)} COP`],
            (histErr) => {
              if (histErr) console.error('Error en historial:', histErr);
            }
          );

           console.log(`✅ Pago aprobado: ${reference} — producto ${id_producto}`);

// Registrar en blockchain
// Obtener wallets reales de vendedor y comprador
db.query(
  `SELECT 
    uc.wallet AS wallet_comprador,
    uv.wallet AS wallet_vendedor
   FROM usuarios uc, usuarios uv
   WHERE uc.id_usuario = ? AND uv.id_usuario = ?`,
  [id_comprador, id_vendedor],
  async (walletErr, walletRows) => {
    if (walletErr || walletRows.length === 0) {
      console.error('❌ Error obteniendo wallets');
      return;
    }

    const { wallet_comprador, wallet_vendedor } = walletRows[0];

    // Usar wallets reales si existen, si no usar placeholder válido
    const vendAddr = wallet_vendedor || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const compAddr = wallet_comprador || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    const hashBlockchain = await registrarTransaccion(
      id_producto,
      vendAddr,
      compAddr,
      valor,
      reference
    );

    if (hashBlockchain) {
      db.query(
        `UPDATE transacciones SET hash_blockchain = ? WHERE referencia = ?`,
        [hashBlockchain, reference]
      );
      console.log(`⛓️ Blockchain registrado: ${hashBlockchain}`);
    }
  }
);
        }
      );
    }

    res.status(200).json({ received: true });
  });
};

// GET /api/pagos/estado/:referencia
const consultarEstado = (req, res) => {
  const { referencia } = req.params;

  const query = `
    SELECT 
      t.*,
      p.tipo_producto, p.color, p.valor,
      CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS comprador
    FROM transacciones t
    JOIN productos p ON t.id_producto = p.id_producto
    JOIN usuarios u ON t.id_comprador = u.id_usuario
    WHERE t.referencia = ?
  `;

  db.query(query, [referencia], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error interno' });
    if (rows.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json(rows[0]);
  });
};

module.exports = { iniciarPago, recibirWebhook, consultarEstado };