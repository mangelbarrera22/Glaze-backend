const db = require("../config/db");
const { emeraldCertificate } = require("../config/blockchain");

// =======================
// 💰 COMPRAR PRODUCTO (NFT + BD)
// =======================
exports.comprarProducto = async (req, res) => {
  const {
    id_producto,
    id_comprador,
    id_vendedor,
    valor_compra,
    token_id
  } = req.body;

  // ==========================
  // 🔐 VALIDACIÓN
  // ==========================
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
    // ==========================
    // 🔑 PASO 1: OBTENER WALLETS
    // ==========================
    const vendedorData = await new Promise((resolve, reject) => {
      db.query(
        "SELECT wallet FROM usuarios WHERE id_usuario = ?",
        [id_vendedor],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const compradorData = await new Promise((resolve, reject) => {
      db.query(
        "SELECT wallet FROM usuarios WHERE id_usuario = ?",
        [id_comprador],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const vendedorWallet = vendedorData[0].wallet;
    const compradorWallet = compradorData[0].wallet;

    // ==========================
    // ⚠️ VALIDACIÓN WALLET
    // ==========================
    if (!vendedorWallet || !compradorWallet) {
      return res.status(400).json({
        error: "Usuario sin wallet registrada"
      });
    }

    // ==========================
    // 🔴 PASO 2: BLOCKCHAIN (TRANSFER NFT)
    // ==========================
    const tx = await emeraldCertificate.transferirCertificado(
      vendedorWallet,
      compradorWallet,
      token_id
    );

    const txHash = tx.hash;

    console.log("⛓ NFT transferido:", txHash);

    const fecha_compra = new Date();

    // ==========================
    // 🟡 PASO 3: REGISTRAR VENTA
    // ==========================
    const sqlVenta = `
      INSERT INTO ventas 
      (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra, tx_hash) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlVenta,
      [
        id_producto,
        id_comprador,
        id_vendedor,
        fecha_compra,
        valor_compra,
        txHash
      ],
      (err, result) => {
        if (err) {
          console.error("❌ Error al insertar venta:", err);
          return res.status(500).json({
            error: "Error registrando venta en base de datos"
          });
        }

        // ==========================
        // 🟢 PASO 4: ACTUALIZAR PRODUCTO
        // ==========================
        const sqlUpdate = `
          UPDATE productos 
          SET estado = 'vendido', id_comprador = ?, fecha_salida = NOW()
          WHERE id_producto = ?
        `;

        db.query(sqlUpdate, [id_comprador, id_producto], (err2) => {
          if (err2) {
            console.error("❌ Error al actualizar producto:", err2);
          }

          // ==========================
          // 🟣 PASO 5: HISTORIAL
          // ==========================
          const sqlHistorial = `
            INSERT INTO historial_producto 
            (id_producto, id_usuario, evento, descripcion, fecha) 
            VALUES (?, ?, ?, ?, NOW())
          `;

          db.query(sqlHistorial, [
            id_producto,
            id_comprador,
            "producto_comprado",
            `Compra NFT exitosa por $${valor_compra}`
          ]);

          // ==========================
          // ✅ RESPUESTA FINAL
          // ==========================
          return res.json({
            mensaje: "Compra realizada correctamente",
            txHash: txHash,
            id_venta: result.insertId
          });
        });
      }
    );

  } catch (error) {
    console.error("❌ Error en transacción blockchain:", error);

    return res.status(500).json({
      error: "Falló la transacción en blockchain"
    });
  }
};

// =======================
// 📦 MIS COMPRAS
// =======================
exports.getMisCompras = (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT v.*, p.tipo_producto, p.color, p.peso, p.valor, p.imagen
    FROM ventas v
    JOIN productos p ON v.id_producto = p.id_producto
    WHERE v.id_comprador = ?
    ORDER BY v.fecha_compra DESC
  `;

  db.query(sql, [id_usuario], (err, result) => {
    if (err) {
      console.error("❌ Error al obtener compras:", err);
      return res.status(500).json({
        error: "Error al obtener la lista de compras"
      });
    }

    res.json(result);
  });
};

// =======================
// 📜 HISTORIAL
// =======================
exports.historialCompras = (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT v.*, p.tipo_producto, p.imagen, p.color, p.peso
    FROM ventas v
    LEFT JOIN productos p ON v.id_producto = p.id_producto
    WHERE v.id_comprador = ?
    ORDER BY v.fecha_compra DESC
  `;

  db.query(sql, [id_usuario], (err, result) => {
    if (err) {
      console.error("❌ Error al obtener historial:", err);
      return res.status(500).json({
        error: "Error al obtener historial de compras"
      });
    }

    res.json(result);
  });
};