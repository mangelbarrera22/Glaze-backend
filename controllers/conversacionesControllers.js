const db = require("../config/db");

// ==========================
// CREAR CONVERSACIÓN
// ==========================
exports.crearConversacion = (req, res) => {

  const { id_receptor } = req.body;
  const id_emisor = req.usuario.id_usuario;

  if (!id_receptor) {
    return res.status(400).json({ error: "Falta id_receptor" });
  }

  // Verificar si ya existe conversación entre ambos
  const sqlCheck = `
    SELECT * FROM conversaciones 
    WHERE (id_emisor = ? AND id_receptor = ?)
       OR (id_emisor = ? AND id_receptor = ?)
  `;

  db.query(sqlCheck, [id_emisor, id_receptor, id_receptor, id_emisor], (err, results) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    // SI YA EXISTE
    if (results.length > 0) {
      return res.json(results[0]);
    }

    // SI NO EXISTE → CREAR
    const sqlInsert = `
      INSERT INTO conversaciones (id_emisor, id_receptor)
      VALUES (?, ?)
    `;

    db.query(sqlInsert, [id_emisor, id_receptor], (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Error creando conversación" });
      }

      res.json({
        id_conversacion: result.insertId,
        id_emisor,
        id_receptor
      });

    });

  });

};


// ==========================
// VER CONVERSACIONES DEL USUARIO
// ==========================
exports.verConversaciones = (req, res) => {

  const id_usuario = req.usuario.id_usuario;

  const sql = `
    SELECT 
      c.id_conversacion,

      u.id_usuario,
      u.usuario,

      CASE 
        WHEN c.id_emisor = ? THEN c.id_receptor
        ELSE c.id_emisor
      END AS otro_usuario_id

    FROM conversaciones c

    JOIN usuarios u 
      ON u.id_usuario = (
        CASE 
          WHEN c.id_emisor = ? THEN c.id_receptor
          ELSE c.id_emisor
        END
      )

    WHERE c.id_emisor = ? OR c.id_receptor = ?
    ORDER BY c.id_conversacion DESC
  `;

  db.query(sql, [id_usuario, id_usuario, id_usuario, id_usuario], (err, results) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error obteniendo conversaciones" });
    }

    res.json(results);

  });

};