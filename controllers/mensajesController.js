const db = require("../config/db");

// =============================
// CREAR O RETORNAR CONVERSACIÓN
// =============================
exports.crearConversacion = (req, res) => {
  const { usuario2_id } = req.body;
  const usuario1_id = req.user.id_usuario;

  if (!usuario2_id) {
    return res.status(400).json({
      error: "usuario2_id es requerido"
    });
  }

  if (usuario1_id === parseInt(usuario2_id)) {
    return res.status(400).json({
      error: "No puedes crear una conversación contigo mismo"
    });
  }

  const checkSql = `
    SELECT id_conversacion
    FROM conversaciones
    WHERE
      (usuario1_id = ? AND usuario2_id = ?)
      OR
      (usuario1_id = ? AND usuario2_id = ?)
  `;

  db.query(
    checkSql,
    [
      usuario1_id,
      usuario2_id,
      usuario2_id,
      usuario1_id
    ],
    (err, rows) => {

      if (err) {
        console.log("Error verificando conversación:", err);
        return res.status(500).json({
          error: "Error interno"
        });
      }

      if (rows.length > 0) {
        return res.json({
          mensaje: "Conversación existente",
          id_conversacion: rows[0].id_conversacion,
          nueva: false
        });
      }

      const insertSql = `
        INSERT INTO conversaciones
        (usuario1_id, usuario2_id, fecha_inicio, estado)
        VALUES (?, ?, NOW(), 'activa')
      `;

      db.query(
        insertSql,
        [usuario1_id, usuario2_id],
        (insertErr, result) => {

          if (insertErr) {
            console.log("Error creando conversación:", insertErr);

            return res.status(500).json({
              error: "Error interno"
            });
          }

          res.status(201).json({
            mensaje: "Conversación creada",
            id_conversacion: result.insertId,
            nueva: true
          });
        }
      );
    }
  );
};


// =============================
// VER CONVERSACIONES
// =============================
exports.verConversaciones = (req, res) => {

  const id_usuario = req.user.id_usuario;

  const sql = `
    SELECT
      c.id_conversacion,
      c.usuario1_id,
      c.usuario2_id,
      c.fecha_inicio,
      c.estado,

      CONCAT(
        u1.primer_nombre,
        ' ',
        u1.primer_apellido
      ) AS nombre_usuario1,

      CONCAT(
        u2.primer_nombre,
        ' ',
        u2.primer_apellido
      ) AS nombre_usuario2,

      (
        SELECT m.contenido_mensaje
        FROM mensajes m
        WHERE m.id_conversacion = c.id_conversacion
        ORDER BY m.fecha_hora DESC
        LIMIT 1
      ) AS ultimo_mensaje,

      (
        SELECT m.fecha_hora
        FROM mensajes m
        WHERE m.id_conversacion = c.id_conversacion
        ORDER BY m.fecha_hora DESC
        LIMIT 1
      ) AS fecha_ultimo_mensaje

    FROM conversaciones c

    JOIN usuarios u1
      ON c.usuario1_id = u1.id_usuario

    JOIN usuarios u2
      ON c.usuario2_id = u2.id_usuario

    WHERE
      c.usuario1_id = ?
      OR
      c.usuario2_id = ?

    ORDER BY fecha_ultimo_mensaje DESC
  `;

  db.query(
    sql,
    [
      id_usuario,
      id_usuario
    ],
    (err, result) => {

      if (err) {
        console.log(
          "❌ Error obteniendo conversaciones:",
          err
        );

        return res.status(500).json({
          error: "Error interno"
        });
      }

      res.json(result);
    }
  );
};


// =============================
// ENVIAR MENSAJE
// =============================
exports.enviarMensaje = (req, res) => {

  const {
    id_conversacion,
    contenido_mensaje
  } = req.body;

  const emisor_id = req.user.id_usuario;

  if (
    !id_conversacion ||
    !contenido_mensaje?.trim()
  ) {
    return res.status(400).json({
      error: "id_conversacion y contenido_mensaje son requeridos"
    });
  }

  // =============================
  // VERIFICAR ACCESO
  // =============================

  const checkSql = `
    SELECT id_conversacion
    FROM conversaciones
    WHERE
      id_conversacion = ?
      AND (
        usuario1_id = ?
        OR
        usuario2_id = ?
      )
  `;

  db.query(
    checkSql,
    [
      id_conversacion,
      emisor_id,
      emisor_id
    ],
    (checkErr, rows) => {

      if (checkErr) {

        console.log(
          "❌ Error verificando conversación:",
          checkErr
        );

        return res.status(500).json({
          error: "Error interno"
        });
      }

      if (rows.length === 0) {
        return res.status(403).json({
          error: "No tienes acceso a esta conversación"
        });
      }

      // =============================
      // INSERTAR MENSAJE
      // =============================

      const insertSql = `
        INSERT INTO mensajes
        (
          id_conversacion,
          emisor_id,
          contenido_mensaje,
          fecha_hora
        )
        VALUES (?, ?, ?, NOW())
      `;

      db.query(
        insertSql,
        [
          id_conversacion,
          emisor_id,
          contenido_mensaje.trim()
        ],
        (err, result) => {

          if (err) {

            console.log(
              "❌ Error enviando mensaje:",
              err
            );

            return res.status(500).json({
              error: "Error interno"
            });
          }

          res.status(201).json({
            mensaje: "Mensaje enviado",
            id_mensaje: result.insertId
          });
        }
      );
    }
  );
};


// =============================
// VER MENSAJES
// =============================
exports.verMensajes = (req, res) => {

  const { id_conversacion } = req.params;

  const id_usuario = req.user?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({
      error: "Usuario no autenticado"
    });
  }

  // =============================
  // VERIFICAR ACCESO
  // =============================

  const checkSql = `
    SELECT id_conversacion
    FROM conversaciones
    WHERE
      id_conversacion = ?
      AND (
        usuario1_id = ?
        OR
        usuario2_id = ?
      )
  `;

  db.query(
    checkSql,
    [
      id_conversacion,
      id_usuario,
      id_usuario
    ],
    (checkErr, rows) => {

      if (checkErr) {

        console.log(
          "❌ Error verificando conversación:",
          checkErr
        );

        return res.status(500).json({
          error: "Error interno"
        });
      }

      if (rows.length === 0) {

        return res.status(403).json({
          error: "No tienes acceso a esta conversación"
        });
      }

      // =============================
      // OBTENER MENSAJES
      // =============================

      const sql = `
        SELECT
          m.id_mensaje,
          m.id_conversacion,
          m.emisor_id,
          m.contenido_mensaje,
          m.fecha_hora,

          CONCAT(
            u.primer_nombre,
            ' ',
            u.primer_apellido
          ) AS nombre_emisor

        FROM mensajes m

        JOIN usuarios u
          ON m.emisor_id = u.id_usuario

        WHERE
          m.id_conversacion = ?

        ORDER BY
          m.fecha_hora ASC
      `;

      db.query(
        sql,
        [id_conversacion],
        (err, result) => {

          if (err) {

            console.log(
              "❌ Error obteniendo mensajes:",
              err
            );

            return res.status(500).json({
              error: "Error interno"
            });
          }

          res.json(result);
        }
      );
    }
  );
};