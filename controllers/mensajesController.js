const db = require("../config/db");

// =============================
// CREAR O RETORNAR CONVERSACION
// =============================
exports.crearConversacion = (req, res) => {
  const { id_vendedor } = req.body;
  const id_comprador = req.user.id_usuario;

  if (!id_vendedor) {
    return res.status(400).json({ error: "id_vendedor es requerido" });
  }

  if (id_comprador === parseInt(id_vendedor)) {
    return res.status(400).json({ error: "No puedes crear una conversación contigo mismo" });
  }

  // Verificar si ya existe conversación entre estos dos usuarios
  const checkSql = `
    SELECT id_conversacion FROM conversaciones
    WHERE id_comprador = ? AND id_vendedor = ?
  `;

  db.query(checkSql, [id_comprador, id_vendedor], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error interno" });

    // Si ya existe, retornarla
    if (rows.length > 0) {
      return res.json({
        mensaje: "Conversación existente",
        id_conversacion: rows[0].id_conversacion,
        nueva: false
      });
    }

    // Si no existe, crearla
    const insertSql = `
      INSERT INTO conversaciones (id_comprador, id_vendedor, fecha_inicio, estado)
      VALUES (?, ?, NOW(), 'activa')
    `;

    db.query(insertSql, [id_comprador, id_vendedor], (insertErr, result) => {
      if (insertErr) return res.status(500).json({ error: "Error interno" });

      res.status(201).json({
        mensaje: "Conversación creada",
        id_conversacion: result.insertId,
        nueva: true
      });
    });
  });
};

// =============================
// VER CONVERSACIONES
// =============================
exports.verConversaciones = (req, res) => {
  const id_usuario = req.user.id_usuario;

  const sql = `
    SELECT 
      c.id_conversacion,
      c.estado,
      c.fecha_inicio,
      CONCAT(comp.primer_nombre, ' ', comp.primer_apellido) AS nombre_comprador,
      CONCAT(vend.primer_nombre, ' ', vend.primer_apellido) AS nombre_vendedor,
      comp.id_usuario AS id_comprador,
      vend.id_usuario AS id_vendedor,
      (
        SELECT contenido_mensaje 
        FROM mensajes m 
        WHERE m.id_conversacion = c.id_conversacion 
        ORDER BY fecha_hora DESC LIMIT 1
      ) AS ultimo_mensaje,
      (
        SELECT fecha_hora 
        FROM mensajes m 
        WHERE m.id_conversacion = c.id_conversacion 
        ORDER BY fecha_hora DESC LIMIT 1
      ) AS fecha_ultimo_mensaje
    FROM conversaciones c
    JOIN usuarios comp ON c.id_comprador = comp.id_usuario
    JOIN usuarios vend ON c.id_vendedor = vend.id_usuario
    WHERE c.id_comprador = ? OR c.id_vendedor = ?
    ORDER BY fecha_ultimo_mensaje DESC
  `;

  db.query(sql, [id_usuario, id_usuario], (err, result) => {
    if (err) return res.status(500).json({ error: "Error interno" });
    res.json(result);
  });
};

// =============================
// ENVIAR MENSAJE
// =============================
exports.enviarMensaje = (req, res) => {
  const { id_conversacion, contenido_mensaje } = req.body;
  const emisor_id = req.user.id_usuario; // ← del token, no del body

  if (!id_conversacion || !contenido_mensaje?.trim()) {
    return res.status(400).json({ error: "id_conversacion y contenido_mensaje son requeridos" });
  }

  // Verificar que el emisor pertenece a la conversación
  const checkSql = `
    SELECT id_conversacion FROM conversaciones
    WHERE id_conversacion = ? AND (id_comprador = ? OR id_vendedor = ?)
  `;

  db.query(checkSql, [id_conversacion, emisor_id, emisor_id], (checkErr, rows) => {
    if (checkErr) return res.status(500).json({ error: "Error interno" });
    if (rows.length === 0) return res.status(403).json({ error: "No tienes acceso a esta conversación" });

    const insertSql = `
      INSERT INTO mensajes (id_conversacion, emisor_id, contenido_mensaje, fecha_hora)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(insertSql, [id_conversacion, emisor_id, contenido_mensaje.trim()], (err, result) => {
      if (err) return res.status(500).json({ error: "Error interno" });

      res.status(201).json({
        mensaje: "Mensaje enviado",
        id_mensaje: result.insertId
      });
    });
  });
};

// =============================
// VER MENSAJES
// =============================
exports.verMensajes = (req, res) => {
  const { id_conversacion } = req.params;
  const id_usuario = req.user.id_usuario;

  // Verificar que el usuario pertenece a la conversación
  const checkSql = `
    SELECT id_conversacion FROM conversaciones
    WHERE id_conversacion = ? AND (id_comprador = ? OR id_vendedor = ?)
  `;

  db.query(checkSql, [id_conversacion, id_usuario, id_usuario], (checkErr, rows) => {
    if (checkErr) return res.status(500).json({ error: "Error interno" });
    if (rows.length === 0) return res.status(403).json({ error: "No tienes acceso a esta conversación" });

    const sql = `
      SELECT 
        m.id_mensaje,
        m.contenido_mensaje,
        m.fecha_hora,
        m.emisor_id,
        CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS nombre_emisor
      FROM mensajes m
      JOIN usuarios u ON m.emisor_id = u.id_usuario
      WHERE m.id_conversacion = ?
      ORDER BY m.fecha_hora ASC
    `;

    db.query(sql, [id_conversacion], (err, result) => {
      if (err) return res.status(500).json({ error: "Error interno" });
      res.json(result);
    });
  });
};