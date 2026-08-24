/**
 * @fileoverview Controlador de procesamiento de compras y ventas para la plataforma Glaze.
 * Coordina la transferencia de certificados NFT en blockchain con la actualización
 * de estados, registros de venta e historial de compras en la base de datos MySQL.
 */

const db = require("../config/db");
const { emeraldCertificate } = require("../config/blockchain");

/**
 * Procesamiento de compra de productos/esmeraldas con NFT asociado.
 * Valida los datos requeridos, obtiene direcciones de wallet, transfiere el NFT en blockchain,
 * registra la venta en BD, actualiza el estado del producto y genera traza de historial.
 * 
 * @route POST /api/ventas/comprar
 * @param {Object} req - Objeto de solicitud de Express con los detalles de la transacción en req.body.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Resultado del procesamiento de la compra y hash de la transacción.
 */
exports.comprarProducto = async (req, res) => {
  const {
    id_producto,
    id_comprador,
    id_vendedor,
    valor_compra,
    token_id
  } = req.body;

  // 1. Validación de payload de entrada
  if (
    !id_producto ||
    !id_comprador ||
    !id_vendedor ||
    !valor_compra ||
    !token_id
  ) {
    return res.status(400).json({
      error: "Faltan datos obligatorios para procesar la compra"
    });
  }

  try {
    // 2. Consulta de direcciones de wallet del vendedor y comprador
    const sqlWallets = "SELECT wallet FROM usuarios WHERE id_usuario = ?";

    const [vendedorData] = await db.promise().query(sqlWallets, [id_vendedor]);
    const [compradorData] = await db.promise().query(sqlWallets, [id_comprador]);

    if (vendedorData.length === 0 || compradorData.length === 0) {
      return res.status(404).json({
        error: "Usuario vendedor o comprador no encontrado"
      });
    }

    const vendedorWallet = vendedorData[0].wallet;
    const compradorWallet = compradorData[0].wallet;

    // Validación de disponibilidad de direcciones de wallet
    if (!vendedorWallet || !compradorWallet) {
      return res.status(400).json({
        error: "El comprador o vendedor no cuenta con una wallet registrada"
      });
    }

    // 3. Transferencia de certificado NFT en Smart Contract
    const tx = await emeraldCertificate.transferirCertificado(
      vendedorWallet,
      compradorWallet,
      token_id
    );

    const txHash = tx.hash;
    console.log("⛓ NFT transferido exitosamente en blockchain:", txHash);

    const fecha_compra = new Date();

    // 4. Inserción de registro de venta en la base de datos
    const sqlVenta = `
      INSERT INTO ventas 
        (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra, tx_hash) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [ventaResult] = await db.promise().query(sqlVenta, [
      id_producto,
      id_comprador,
      id_vendedor,
      fecha_compra,
      valor_compra,
      txHash
    ]);

    // 5. Actualización del estado del producto a 'vendido'
    const sqlUpdateProducto = `
      UPDATE productos 
      SET estado = 'vendido', id_comprador = ?, fecha_salida = NOW()
      WHERE id_producto = ?
    `;

    await db.promise().query(sqlUpdateProducto, [id_comprador, id_producto]);

    // 6. Registro de evento en el historial del producto
    const sqlHistorial = `
      INSERT INTO historial_producto 
        (id_producto, id_usuario, evento, descripcion, fecha) 
      VALUES (?, ?, ?, ?, NOW())
    `;

    await db.promise().query(sqlHistorial, [
      id_producto,
      id_comprador,
      "producto_comprado",
      `Compra NFT exitosa por $${valor_compra}`
    ]);

    // 7. Respuesta de confirmación
    return res.json({
      mensaje: "Compra realizada correctamente",
      txHash: txHash,
      id_venta: ventaResult.insertId
    });

  } catch (error) {
    console.error("❌ Error en la transacción de compra o blockchain:", error);

    return res.status(500).json({
      error: "Falló el procesamiento de la transacción o la interacción en blockchain"
    });
  }
};

/**
 * Obtiene el listado de compras realizadas por un usuario específico.
 * 
 * @route GET /api/ventas/mis-compras/:id_usuario
 * @param {Object} req - Objeto de solicitud de Express (req.params.id_usuario).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Colección de ventas asociadas al comprador con datos agregados del producto.
 */
exports.getMisCompras = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const sql = `
      SELECT v.*, p.tipo_producto, p.color, p.peso, p.valor, p.imagen
      FROM ventas v
      JOIN productos p ON v.id_producto = p.id_producto
      WHERE v.id_comprador = ?
      ORDER BY v.fecha_compra DESC
    `;

    const [rows] = await db.promise().query(sql, [id_usuario]);

    res.json(rows);

  } catch (error) {
    console.error("❌ Error al obtener el listado de compras:", error);
    res.status(500).json({
      error: "Error al obtener la lista de compras del usuario"
    });
  }
};

/**
 * Obtiene el historial histórico de compras del usuario (incluyendo productos dados de baja o modificados).
 * 
 * @route GET /api/ventas/historial/:id_usuario
 * @param {Object} req - Objeto de solicitud de Express (req.params.id_usuario).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Colección de registros de compras históricas del usuario.
 */
exports.historialCompras = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const sql = `
      SELECT v.*, p.tipo_producto, p.imagen, p.color, p.peso
      FROM ventas v
      LEFT JOIN productos p ON v.id_producto = p.id_producto
      WHERE v.id_comprador = ?
      ORDER BY v.fecha_compra DESC
    `;

    const [rows] = await db.promise().query(sql, [id_usuario]);

    res.json(rows);

  } catch (error) {
    console.error("❌ Error al obtener el historial de compras:", error);
    res.status(500).json({
      error: "Error al obtener el historial de compras"
    });
  }
};