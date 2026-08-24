/**
 * @fileoverview Controlador de integración Blockchain para la plataforma Glaze.
 * Gestiona el minteo de certificados NFT (ERC-721), el registro de transacciones en Smart Contracts,
 * la verificación de autencidad de esmeraldas y las consultas del histórico en la base de datos.
 */

const { emeraldCertificate, glazeMarket } = require("../config/blockchain");
const db = require("../config/db");
const { ethers } = require("ethers");

/**
 * Mintea un certificado NFT en la blockchain para un producto específico.
 * Obtiene la información del producto y del vendedor desde la BD, valida la dirección de la wallet,
 * verifica que no posea un certificado previo y ejecuta la transacción de minteo.
 * 
 * @route POST /api/blockchain/mintear/:id_producto
 * @param {Object} req - Objeto de solicitud de Express (req.params.id_producto).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Detalle del minteo exitoso con el hash de transacción o el mensaje de error.
 */
const mintearCertificado = async (req, res) => {
  const { id_producto } = req.params;

  try {
    // 1. Consultar información del producto y del vendedor en la base de datos
    const sqlProducto = `
      SELECT p.*, u.wallet AS wallet_vendedor,
             CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS vendedor_nombre
      FROM productos p
      JOIN usuarios u ON p.id_vendedor = u.id_usuario
      WHERE p.id_producto = ?
    `;

    const [rows] = await db.promise().query(sqlProducto, [id_producto]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        ok: false,
        error: "Producto no encontrado" 
      });
    }

    const producto = rows[0];

    console.log("📦 Producto:", producto.id_producto);
    console.log("💰 Valor:", producto.valor);
    console.log("👤 Wallet vendedor:", producto.wallet_vendedor);

    // 2. Validar que el vendedor tenga una wallet configurada y con formato válido
    if (!producto.wallet_vendedor) {
      return res.status(400).json({
        ok: false,
        error: "El vendedor no tiene una wallet registrada en la plataforma"
      });
    }

    if (!ethers.isAddress(producto.wallet_vendedor)) {
      return res.status(400).json({
        ok: false,
        error: "La dirección de la wallet del vendedor es inválida"
      });
    }

    const vendedor = producto.wallet_vendedor;

    // 3. Prevenir minteo duplicado verificando el estado actual en el contrato inteligente
    const tokenExistente = await emeraldCertificate.obtenerTokenPorProducto(producto.id_producto);

    if (tokenExistente.toString() !== "0") {
      return res.status(400).json({
        ok: false,
        error: "Este producto ya cuenta con un certificado registrado en la blockchain"
      });
    }

    // 4. Ejecutar el minteo del NFT en la blockchain
    console.log("🚀 Minteando certificado NFT en blockchain...");

    const tx = await emeraldCertificate.mintCertificado(
      vendedor,
      producto.id_producto,
      producto.tipo_producto || "Esmeralda",
      producto.color || "Verde",
      producto.peso?.toString() || "0",
      producto.origen || "Colombia",
      Math.round(parseFloat(producto.valor || 0))
    );

    // Esperar confirmación del bloque
    const receipt = await tx.wait();
    console.log("✅ Certificado NFT creado exitosamente:", receipt.hash);

    // 5. Guardar/Actualizar la traza del registro en la tabla local 'blockchain_registro'
    const sqlInsertRegistro = `
      INSERT INTO blockchain_registro 
        (id_producto, fecha_entrada, peso, imagen, certificacion, id_vendedor, valor, hash_blockchain)
      VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        fecha_entrada = VALUES(fecha_entrada),
        peso = VALUES(peso),
        imagen = VALUES(imagen),
        certificacion = VALUES(certificacion),
        id_vendedor = VALUES(id_vendedor),
        valor = VALUES(valor),
        hash_blockchain = VALUES(hash_blockchain)
    `;

    await db.promise().query(sqlInsertRegistro, [
      producto.id_producto,
      producto.peso || null,
      producto.imagen || null,
      "Certificado Blockchain",
      producto.id_vendedor,
      producto.valor || 0,
      receipt.hash
    ]);

    console.log("💾 Registro guardado correctamente en la base de datos local");

    // 6. Respuesta al cliente
    res.json({
      ok: true,
      mensaje: "Certificado emitido correctamente",
      txHash: receipt.hash,
      tokenId: producto.id_producto
    });

  } catch (error) {
    console.error("❌ Error en el proceso de minteo de NFT:", error);

    res.status(500).json({
      ok: false,
      error: error.reason || error.message || "Error interno al procesar el minteo"
    });
  }
};

/**
 * Función auxiliar interna para registrar una transacción comercial en el Smart Contract 'GlazeMarket'.
 * 
 * @param {number|string} idProducto - ID del producto comercializado.
 * @param {string} vendedorAddress - Dirección de wallet del vendedor.
 * @param {string} compradorAddress - Dirección de wallet del comprador.
 * @param {number} valor - Monto total de la transacción.
 * @param {string} referencia - Código único de referencia del pago (ej. Wompi/Internal).
 * @returns {Promise<string|null>} Hash de la transacción confirmada en blockchain o null si falla.
 */
const registrarTransaccion = async (
  idProducto,
  vendedorAddress,
  compradorAddress,
  valor,
  referencia
) => {
  try {
    console.log("📦 Registrando transacción en Smart Contract GlazeMarket...");
    console.log("Producto:", idProducto);
    console.log("Vendedor:", vendedorAddress);
    console.log("Comprador:", compradorAddress);

    const tx = await glazeMarket.registrarTransaccion(
      idProducto,
      vendedorAddress,
      compradorAddress,
      Math.round(valor),
      referencia
    );

    const receipt = await tx.wait();
    console.log(`✅ Transacción registrada en Blockchain. Hash: ${receipt.hash}`);

    return receipt.hash;

  } catch (error) {
    console.error("❌ Error registrando transacción en blockchain:", error);
    return null;
  }
};

/**
 * Verifica directamente en el Smart Contract los datos de un certificado de esmeralda.
 * 
 * @route GET /api/blockchain/verificar/:id_producto
 * @param {Object} req - Objeto de solicitud de Express (req.params.id_producto).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Información detallada de la esmeralda directo desde el Smart Contract.
 */
const verificarCertificado = async (req, res) => {
  const { id_producto } = req.params;

  try {
    const tokenId = await emeraldCertificate.obtenerTokenPorProducto(id_producto);

    if (tokenId.toString() === "0") {
      return res.json({
        certificado: false,
        mensaje: "El producto no cuenta con certificado en blockchain"
      });
    }

    const esmeralda = await emeraldCertificate.obtenerEsmeralda(tokenId);

    res.json({
      certificado: true,
      tokenId: tokenId.toString(),
      datos: {
        idProducto: esmeralda.idProducto.toString(),
        tipoProducto: esmeralda.tipoProducto,
        color: esmeralda.color,
        peso: esmeralda.peso,
        origen: esmeralda.origen,
        valor: esmeralda.valor.toString(),
        vendedor: esmeralda.vendedor,
        fechaRegistro: new Date(Number(esmeralda.fechaRegistro) * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error al verificar certificado en blockchain:", error);

    res.status(500).json({
      error: "Error al verificar la autenticidad del certificado"
    });
  }
};

/**
 * Obtiene los detalles del registro de traza blockchain almacenado localmente para un producto.
 * 
 * @route GET /api/blockchain/registro/:id_producto
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Datos del registro local en `blockchain_registro`.
 */
const obtenerRegistro = async (req, res) => {
  const { id_producto } = req.params;

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM blockchain_registro WHERE id_producto = ?",
      [id_producto]
    );

    if (rows.length === 0) {
      return res.json({
        ok: false,
        mensaje: "Este producto no posee registro local de blockchain"
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("❌ Error en base de datos al obtener el registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtiene el historial completo de registros e interacciones blockchain almacenados.
 * 
 * @route GET /api/blockchain/historial
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Listado histórico ordenado de mayor a menor antigüedad.
 */
const historialBlockchain = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM blockchain_registro ORDER BY fecha_entrada DESC"
    );

    res.json({
      ok: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("❌ Error en base de datos al obtener el historial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtiene la información consolidada de un producto uniendo sus datos generales con el hash blockchain.
 * 
 * @route GET /api/blockchain/producto-completo/:id_producto
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Objeto unificado del producto con su traza blockchain.
 */
const obtenerProductoCompleto = async (req, res) => {
  const { id_producto } = req.params;

  try {
    const sql = `
      SELECT p.*, b.hash_blockchain, b.fecha_entrada, b.fecha_salida
      FROM productos p
      LEFT JOIN blockchain_registro b ON p.id_producto = b.id_producto
      WHERE p.id_producto = ?
    `;

    const [rows] = await db.promise().query(sql, [id_producto]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        ok: false,
        error: "Producto no encontrado" 
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("❌ Error en base de datos al obtener el producto completo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  mintearCertificado,
  registrarTransaccion,
  verificarCertificado,
  obtenerRegistro,
  historialBlockchain,
  obtenerProductoCompleto
};