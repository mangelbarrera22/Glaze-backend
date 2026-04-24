const { emeraldCertificate, glazeMarket } = require("../config/blockchain");
const db = require("../config/db");
const { ethers } = require("ethers");

// ==========================
// 🪙 MINTEAR CERTIFICADO NFT
// ==========================
const mintearCertificado = async (req, res) => {
  const { id_producto } = req.params;

  db.query(
    `SELECT p.*, u.wallet AS wallet_vendedor,
            CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS vendedor_nombre
     FROM productos p
     JOIN usuarios u ON p.id_vendedor = u.id_usuario
     WHERE p.id_producto = ?`,
    [id_producto],
    async (err, rows) => {

      if (err) {
        console.error("❌ Error DB:", err);
        return res.status(500).json({ error: "Error interno" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const producto = rows[0];

      try {
        console.log("📦 Producto:", producto.id_producto);
        console.log("💰 Valor:", producto.valor);
        console.log("👤 Wallet vendedor:", producto.wallet_vendedor);

        // ==========================
        // 🚫 VALIDAR WALLET
        // ==========================
        if (!producto.wallet_vendedor) {
          return res.status(400).json({
            ok: false,
            error: "El vendedor no tiene wallet registrada"
          });
        }

        if (!ethers.isAddress(producto.wallet_vendedor)) {
          return res.status(400).json({
            ok: false,
            error: "Wallet inválida"
          });
        }

        const vendedor = producto.wallet_vendedor;

        // ==========================
        // 🚫 EVITAR DUPLICADOS
        // ==========================
        const tokenExistente = await emeraldCertificate.obtenerTokenPorProducto(producto.id_producto);

        if (tokenExistente.toString() !== "0") {
          return res.status(400).json({
            ok: false,
            error: "Este producto ya tiene certificado"
          });
        }

        // ==========================
        // 🚀 MINT NFT
        // ==========================
        console.log("🚀 Minteando NFT...");

        const tx = await emeraldCertificate.mintCertificado(
          vendedor,
          producto.id_producto,
          producto.tipo_producto || "Esmeralda",
          producto.color || "Verde",
          producto.peso?.toString() || "0",
          producto.origen || "Colombia",
          Math.round(parseFloat(producto.valor || 0))
        );

        const receipt = await tx.wait();

        console.log("✅ NFT creado:", receipt.hash);

        // ==========================
        // 💾 GUARDAR TODO EN DB
        // ==========================
        db.query(
          `INSERT INTO blockchain_registro 
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
          `,
          [
            producto.id_producto,
            producto.peso || null,
            producto.imagen || null,
            "Certificado Blockchain",
            producto.id_vendedor,
            producto.valor || 0,
            receipt.hash
          ],
          (dbErr) => {
            if (dbErr) {
              console.error("❌ Error guardando registro completo:", dbErr);
            } else {
              console.log("💾 Registro blockchain guardado correctamente");
            }
          }
        );

        // ==========================
        // 📤 RESPUESTA
        // ==========================
        res.json({
          ok: true,
          mensaje: "Certificado emitido correctamente",
          txHash: receipt.hash,
          tokenId: producto.id_producto
        });

      } catch (error) {
        console.error("❌ Error mint NFT:", error);

        res.status(500).json({
          ok: false,
          error: error.reason || error.message
        });
      }
    }
  );
};

// ==========================
// 💳 REGISTRAR TRANSACCIÓN
// ==========================
const registrarTransaccion = async (
  idProducto,
  vendedorAddress,
  compradorAddress,
  valor,
  referencia
) => {
  try {
    console.log("📦 Registrando transacción...");
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

    console.log(`✅ TX registrada: ${receipt.hash}`);

    return receipt.hash;

  } catch (error) {
    console.error("❌ Error blockchain:", error);
    return null;
  }
};

// ==========================
// 🔍 VERIFICAR CERTIFICADO
// ==========================
const verificarCertificado = async (req, res) => {
  const { id_producto } = req.params;

  try {
    const tokenId = await emeraldCertificate.obtenerTokenPorProducto(id_producto);

    if (tokenId.toString() === "0") {
      return res.json({
        certificado: false,
        mensaje: "Sin certificado en blockchain"
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
        fechaRegistro: new Date(
          Number(esmeralda.fechaRegistro) * 1000
        ).toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error verificando:", error);

    res.status(500).json({
      error: "Error al verificar certificado"
    });
  }
};

// ==========================
// 📦 OBTENER REGISTRO BLOCKCHAIN POR PRODUCTO
// ==========================
const obtenerRegistro = async (req, res) => {
  const { id_producto } = req.params;

  db.query(
    `SELECT * FROM blockchain_registro WHERE id_producto = ?`,
    [id_producto],
    (err, rows) => {

      if (err) {
        console.error("❌ Error DB:", err);
        return res.status(500).json({ error: "Error interno" });
      }

      if (rows.length === 0) {
        return res.json({
          ok: false,
          mensaje: "Este producto no tiene registro blockchain"
        });
      }

      res.json({
        ok: true,
        data: rows[0]
      });
    }
  );
};
// ==========================
// 📜 HISTORIAL BLOCKCHAIN
// ==========================
const historialBlockchain = async (req, res) => {

  db.query(
    `SELECT * FROM blockchain_registro ORDER BY fecha_entrada DESC`,
    (err, rows) => {

      if (err) {
        console.error("❌ Error DB:", err);
        return res.status(500).json({ error: "Error interno" });
      }

      res.json({
        ok: true,
        total: rows.length,
        data: rows
      });
    }
  );
};


// ==========================
// 🔗 PRODUCTO + BLOCKCHAIN
// ==========================
const obtenerProductoCompleto = async (req, res) => {
  const { id_producto } = req.params;

  db.query(
    `SELECT p.*, b.hash_blockchain, b.fecha_entrada, b.fecha_salida
     FROM productos p
     LEFT JOIN blockchain_registro b 
     ON p.id_producto = b.id_producto
     WHERE p.id_producto = ?`,
    [id_producto],
    (err, rows) => {

      if (err) {
        console.error("❌ Error DB:", err);
        return res.status(500).json({ error: "Error interno" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json({
        ok: true,
        data: rows[0]
      });
    }
  );
};

module.exports = {
  mintearCertificado,
  registrarTransaccion,
  verificarCertificado,
  obtenerRegistro,
  historialBlockchain,
  obtenerProductoCompleto
};