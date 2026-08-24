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

// Helper para promisificar queries de MySQL
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// POST /api/pagos/iniciar
const iniciarPago = async (req, res) => {
  try {
    const { id_producto, id_vendedor } = req.body;
    const id_comprador = req.user.id || req.user.id_usuario;

    if (!id_producto || !id_vendedor) {
      return res.status(400).json({ error: 'id_producto e id_vendedor son requeridos' });
    }

    const rows = await queryAsync('SELECT valor, estado FROM productos WHERE id_producto = ?', [id_producto]);

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

    const result = await queryAsync(insertQuery, [referencia, id_producto, id_comprador, id_vendedor, montoCentavos]);

    // Opciones del Web Checkout de Wompi
    const urlPago = `https://checkout.wompi.co/p/?public-key=${process.env.WOMPI_PUBLIC_KEY}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}&signature:integrity=${firma}&redirect-url=${encodeURIComponent(process.env.WOMPI_REDIRECT_URL)}`;

    res.json({
      transaccionId: result.insertId,
      referencia,
      monto,
      urlPago
    });
  } catch (error) {
    console.error('Error en iniciarPago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/pagos/webhook
const recibirWebhook = async (req, res) => {
  try {
    const { event, data, timestamp, signature } = req.body;

    if (event !== 'transaction.updated') {
      return res.status(200).json({ received: true });
    }

    const { transaction } = data;
    const { reference, status, payment_method_type, id: wompiId, amount_in_cents } = transaction;

    // 1. Validar firma del webhook para evitar peticiones maliciosas
    const checksumCadena = `${transaction.id}${transaction.status}${amount_in_cents}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`;
    const hashCalculado = crypto.createHash('sha256').update(checksumCadena).digest('hex');

    if (signature.properties && hashCalculado !== signature.checksum) {
      console.warn('⚠️ Webhook recibido con firma inválida');
      return res.status(400).json({ error: 'Firma inválida' });
    }

    // 2. Verificar estado actual de la transacción local para evitar procesamientos dobles
    const txActual = await queryAsync('SELECT estado FROM transacciones WHERE referencia = ?', [reference]);
    if (txActual.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
    
    // Si ya fue procesada, respondemos a Wompi con éxito sin repetir lógica
    if (txActual[0].estado === 'APROBADO') {
      return res.status(200).json({ received: true, message: 'Ya procesada' });
    }

    const estadoMap = {
      'APPROVED': 'APROBADO',
      'DECLINED': 'RECHAZADO',
      'VOIDED':   'ANULADO',
      'ERROR':    'RECHAZADO'
    };

    const nuevoEstado = estadoMap[status] || 'PENDIENTE';

    // Actualizar estado general de la transacción
    await queryAsync(
      `UPDATE transacciones SET estado = ?, metodo_pago = ?, wompi_id = ? WHERE referencia = ?`,
      [nuevoEstado, payment_method_type, wompiId, reference]
    );

    // 3. Procesar venta y actualizar inventario si fue aprobado
    if (nuevoEstado === 'APROBADO') {
      const txDetails = await queryAsync(
        'SELECT id_producto, id_comprador, id_vendedor, monto_centavos FROM transacciones WHERE referencia = ?',
        [reference]
      );

      if (txDetails.length > 0) {
        const { id_producto, id_comprador, id_vendedor, monto_centavos } = txDetails[0];
        const valor = monto_centavos / 100;

        // Ejecutar escrituras clave
        await queryAsync(
          `INSERT INTO ventas (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra) VALUES (?, ?, ?, CURDATE(), ?)`,
          [id_producto, id_comprador, id_vendedor, valor]
        );

        await queryAsync(
          `UPDATE productos SET estado = 'vendido', id_comprador = ? WHERE id_producto = ?`,
          [id_comprador, id_producto]
        );

        await queryAsync(
          `INSERT INTO historial_producto (id_producto, id_usuario, evento, descripcion, fecha) VALUES (?, ?, 'producto_comprado', ?, NOW())`,
          [id_producto, id_comprador, `Compra exitosa por valor de $${valor.toFixed(2)} COP`]
        );

        console.log(`✅ Pago aprobado: ${reference} — producto ${id_producto}`);

        // 4. Registro en Blockchain
        try {
          const wallets = await queryAsync(
            `SELECT 
               (SELECT wallet FROM usuarios WHERE id_usuario = ?) AS wallet_comprador,
               (SELECT wallet FROM usuarios WHERE id_usuario = ?) AS wallet_vendedor`,
            [id_comprador, id_vendedor]
          );

          const wallet_comprador = wallets[0]?.wallet_comprador;
          const wallet_vendedor = wallets[0]?.wallet_vendedor;

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
            await queryAsync(
              `UPDATE transacciones SET hash_blockchain = ? WHERE referencia = ?`,
              [hashBlockchain, reference]
            );
            console.log(`⛓️ Blockchain registrado: ${hashBlockchain}`);
          }
        } catch (bcErr) {
          console.error('❌ Error registrando en blockchain:', bcErr);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    return res.status(500).json({ error: 'Error interno procesando webhook' });
  }
};

// GET /api/pagos/estado/:referencia
const consultarEstado = async (req, res) => {
  try {
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

    const rows = await queryAsync(query, [referencia]);
    if (rows.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al consultar estado:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { iniciarPago, recibirWebhook, consultarEstado };