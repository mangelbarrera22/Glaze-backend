const db = require("../config/db");

// ==========================
// 📦 GET TODOS LOS PRODUCTOS
// ==========================
const getProductos = (req, res) => {
  db.query(
    "SELECT * FROM productos ORDER BY id_producto DESC",
    (err, rows) => {
      if (err) {
        console.error("ERROR PRODUCTOS:", err);
        return res.status(500).json({ error: "Error al obtener productos" });
      }
      res.json(rows);
    }
  );
};

// ==========================
// 🔍 GET PRODUCTO POR ID
// ==========================
const getProductoById = (req, res) => {
  const { id } = req.params;

  // Hacemos un LEFT JOIN para traer datos de la tabla joyas si existen
  const sql = `
    SELECT p.*, j.tiene_esmeralda, j.oro, j.oro_rosado, j.plata 
    FROM productos p 
    LEFT JOIN joyas j ON p.id_producto = j.id_producto 
    WHERE p.id_producto = ?`;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("ERROR PRODUCTO:", err);
      return res.status(500).json({ error: "Error al obtener producto" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    res.json(rows[0]);
  });
};

// ==========================
// ➕ CREAR PRODUCTO
// ==========================
const crearProducto = (req, res) => {
  const {
    tipo_producto,
    color,
    peso,
    valor,
    tratamiento,
    stock,
    tiene_esmeralda,
    oro,
    oro_rosado,
    plata
  } = req.body;

  const id_vendedor = req.user.id;
  let imagen = null;
  let certificado = null;

  if (req.files) {
    if (req.files.imagen) imagen = req.files.imagen[0].filename;
    if (req.files.certificado) certificado = req.files.certificado[0].filename;
  }

  db.query(
    `INSERT INTO productos 
    (tipo_producto, color, peso, tratamiento, valor, imagen, certificado, stock, id_vendedor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo_producto, color, peso, tratamiento, valor, imagen, certificado, stock, id_vendedor],
    (err, result) => {
      if (err) {
        console.error("ERROR CREAR PRODUCTO:", err);
        return res.status(500).json({ error: "Error al crear producto" });
      }

      const id_producto = result.insertId;

      if (tipo_producto === "joya") {
        db.query(
          `INSERT INTO joyas (id_producto, tiene_esmeralda, oro, oro_rosado, plata) VALUES (?, ?, ?, ?, ?)`,
          [id_producto, tiene_esmeralda, oro, oro_rosado, plata],
          (err2) => {
            if (err2) {
              console.error("ERROR JOYA:", err2);
              return res.status(500).json({ error: "Error al crear joya" });
            }
            return res.json({ mensaje: "Joya creada correctamente 🔥", id_producto });
          }
        );
      } else {
        res.json({ mensaje: "Producto creado correctamente 🔥", id_producto });
      }
    }
  );
};

// ==========================
// ✏️ ACTUALIZAR PRODUCTO (Final)
// ==========================
const actualizarProducto = (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const {
    color, peso, tratamiento, valor, stock,
    tiene_esmeralda, oro, oro_rosado, plata
  } = body;

  let imagen = null;
  let certificado = null;

  if (req.files) {
    if (req.files.imagen) imagen = req.files.imagen[0].filename;
    if (req.files.certificado) certificado = req.files.certificado[0].filename;
  }

  // 1. Obtener tipo_producto para saber si debemos tocar la tabla joyas
  db.query("SELECT tipo_producto FROM productos WHERE id_producto = ?", [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: "No se encontró el activo en boveda" });
    }

    const tipo_actual = results[0].tipo_producto;

    // 2. Construcción dinámica de la query
    let sql = `UPDATE productos SET color=?, peso=?, tratamiento=?, valor=?, stock=?`;
    let params = [color, peso, tratamiento, valor, stock];

    if (imagen) {
      sql += `, imagen=?`;
      params.push(imagen);
    }
    if (certificado) {
      sql += `, certificado=?`;
      params.push(certificado);
    }

    sql += ` WHERE id_producto=?`;
    params.push(id);

    db.query(sql, params, (errUpd) => {
      if (errUpd) {
        console.error("ERROR SQL UPDATE:", errUpd);
        return res.status(500).json({ error: "Error al actualizar producto" });
      }

      // 3. Si es joya, actualizamos la tabla secundaria
      if (tipo_actual === "joya") {
        db.query(
          `UPDATE joyas SET tiene_esmeralda=?, oro=?, oro_rosado=?, plata=? WHERE id_producto=?`,
          [
            tiene_esmeralda == '1' || tiene_esmeralda == 1 ? 1 : 0,
            oro == '1' || oro == 1 ? 1 : 0,
            oro_rosado == '1' || oro_rosado == 1 ? 1 : 0,
            plata == '1' || plata == 1 ? 1 : 0,
            id
          ],
          (errJoya) => {
            if (errJoya) {
              console.error("ERROR JOYA UPDATE:", errJoya);
              return res.status(500).json({ error: "Error al actualizar joya" });
            }
            return res.json({ mensaje: "Joya y certificados actualizados correctamente 💎" });
          }
        );
      } else {
        res.json({ mensaje: "Producto actualizado correctamente 💎" });
      }
    });
  });
};

// ==========================
// ❌ ELIMINAR PRODUCTO
// ==========================
const eliminarProducto = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM productos WHERE id_producto = ?",
    [id],
    (err) => {
      if (err) {
        console.error("ERROR ELIMINAR:", err);
        return res.status(500).json({ error: "Error al eliminar producto" });
      }
      res.json({ mensaje: "Producto eliminado" });
    }
  );
};

// ==========================
// 📊 PRODUCTOS POR VENDEDOR
// ==========================
const getProductosPorVendedor = (req, res) => {
  const { id_usuario } = req.params;

  db.query(
    "SELECT * FROM productos WHERE id_vendedor = ? ORDER BY id_producto DESC",
    [id_usuario],
    (err, rows) => {
      if (err) {
        console.error("ERROR VENDEDOR:", err);
        return res.status(500).json({ error: "Error al obtener productos" });
      }
      res.json(rows);
    }
  );
};

module.exports = {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  getProductosPorVendedor
};