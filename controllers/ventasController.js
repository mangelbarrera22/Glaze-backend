const db = require('../config/db');

// ==========================
// CREAR VENTA
// ==========================
exports.crearVenta = (req, res) => {

    const { id_producto, id_comprador, id_vendedor, valor_compra } = req.body;

    if (!id_producto || !id_comprador || !id_vendedor || !valor_compra) {
        return res.status(400).json({ error: "Faltan datos para registrar la venta" });
    }

    const fecha_compra = new Date();

    const sql = `
        INSERT INTO ventas 
        (id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [id_producto, id_comprador, id_vendedor, fecha_compra, valor_compra], (err, result) => {

        if (err) {
            console.log("Error insertar venta:", err);
            return res.status(500).json({ error: "Error al registrar venta" });
        }

        // ✅ actualizar producto a vendido
        const updateProducto = `
            UPDATE productos 
            SET estado = 'vendido', id_comprador = ?, fecha_salida = NOW()
            WHERE id_producto = ?
        `;

        db.query(updateProducto, [id_comprador, id_producto], (err2) => {
            if (err2) console.log("Error actualizando producto:", err2);
        });

        // ✅ registrar historial
        const historial = `
            INSERT INTO historial_producto
            (id_producto, id_usuario, evento, descripcion, fecha)
            VALUES (?, ?, ?, ?, NOW())
        `;

        db.query(historial, [
            id_producto,
            id_comprador,
            "producto_vendido",
            "Producto comprado por el usuario"
        ], (err3) => {
            if (err3) console.log("Error en historial:", err3);
        });

        res.json({
            mensaje: "Venta registrada correctamente",
            id_venta: result.insertId
        });

    });
};


// ==========================
// HISTORIAL DE COMPRAS
// ==========================
exports.historialCompras = (req, res) => {

    const { id_usuario } = req.params;

    const sql = `
        SELECT 
            v.id_venta,
            v.id_producto,
            v.fecha_compra,
            v.valor_compra,

            CONCAT(p.tipo_producto, ' - ', p.color, ' - ', p.peso, 'ct') AS nombre_producto,
            p.imagen,
            p.valor AS valor_producto

        FROM ventas v
        LEFT JOIN productos p ON v.id_producto = p.id_producto
        WHERE v.id_comprador = ?
        ORDER BY v.fecha_compra DESC
    `;

    db.query(sql, [id_usuario], (err, result) => {

        if (err) {
            console.log("Error historial:", err);
            return res.status(500).json({ 
                mensaje: "Error al obtener historial", 
                error: err 
            });
        }

        res.json(result);
    });
};


// ==========================
// VENTAS POR VENDEDOR
// ==========================
exports.ventasPorVendedor = (req, res) => {

    const { id_usuario } = req.params;

    const sql = `
        SELECT 
            v.id_venta,
            v.id_producto,
            v.fecha_compra,
            v.valor_compra,
            v.id_comprador,

            CONCAT(p.tipo_producto, ' - ', p.color, ' - ', p.peso, 'ct') AS nombre_producto,
            p.imagen,
            p.valor AS valor_producto

        FROM ventas v
        LEFT JOIN productos p ON v.id_producto = p.id_producto
        WHERE v.id_vendedor = ?
        ORDER BY v.fecha_compra DESC
    `;

    db.query(sql, [id_usuario], (err, result) => {

        if (err) {
            console.log("Error ventas vendedor:", err);
            return res.status(500).json({
                mensaje: "Error al obtener ventas del vendedor",
                error: err
            });
        }

        res.json(result);
    });
};