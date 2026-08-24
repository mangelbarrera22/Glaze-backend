const db = require("../config/db");

// ==========================
// CREAR O RETORNAR CONVERSACIÓN
// ==========================
exports.crearConversacion = (req, res) => {

  const { id_vendedor } = req.body;

  // Usuario actualmente autenticado
  const id_usuario = req.user?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({
      error: "Usuario no autenticado"
    });
  }

  if (!id_vendedor) {
    return res.status(400).json({
      error: "Falta id_vendedor"
    });
  }

  // No puede hablar consigo mismo
  if (Number(id_usuario) === Number(id_vendedor)) {
    return res.status(400).json({
      error: "No puedes iniciar una conversación contigo mismo"
    });
  }

  /*
   * Buscamos en ambos sentidos:
   *
   * usuario1 = usuario actual / usuario2 = vendedor
   *
   * O
   *
   * usuario1 = vendedor / usuario2 = usuario actual
   *
   * Así evitamos crear conversaciones duplicadas.
   */
  const sqlCheck = `
    SELECT *
    FROM conversaciones
    WHERE
      (
        usuario1_id = ?
        AND usuario2_id = ?
      )
      OR
      (
        usuario1_id = ?
        AND usuario2_id = ?
      )
    LIMIT 1
  `;

  db.query(
    sqlCheck,
    [
      id_usuario,
      id_vendedor,
      id_vendedor,
      id_usuario
    ],
    (err, results) => {

      if (err) {
        console.log("❌ Error verificando conversación:", err);

        return res.status(500).json({
          error: "Error verificando conversación"
        });
      }

      // ==========================================
      // YA EXISTE
      // ==========================================
      if (results.length > 0) {

        console.log(
          "✅ Conversación existente:",
          results[0].id_conversacion
        );

        return res.json(results[0]);
      }

      // ==========================================
      // NO EXISTE → CREAR
      // ==========================================
      const sqlInsert = `
        INSERT INTO conversaciones
        (
          usuario1_id,
          usuario2_id,
          fecha_inicio,
          estado
        )
        VALUES (?, ?, NOW(), 'activa')
      `;

      db.query(
        sqlInsert,
        [
          id_usuario,
          id_vendedor
        ],
        (err, result) => {

          if (err) {
            console.log("❌ Error creando conversación:", err);

            return res.status(500).json({
              error: "Error creando conversación"
            });
          }

          console.log(
            "✅ Nueva conversación creada:",
            result.insertId
          );

          res.json({
            id_conversacion: result.insertId,
            usuario1_id: id_usuario,
            usuario2_id: id_vendedor,
            fecha_inicio: new Date(),
            estado: "activa"
          });

        }
      );
    }
  );
};

// ==========================
// VER CONVERSACIONES DEL USUARIO
// ==========================
exports.verConversaciones = (req, res) => {

  const id_usuario = req.user?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({
      error: "Usuario no autenticado"
    });
  }

  const sql = `
  SELECT

    c.id_conversacion,
    c.usuario1_id,
    c.usuario2_id,
    c.fecha_inicio,
    c.estado,

    CASE
        WHEN c.usuario1_id = ?
        THEN c.usuario2_id
        ELSE c.usuario1_id
    END AS otro_usuario_id,

    CASE
        WHEN c.usuario1_id = ?
        THEN CONCAT(u2.primer_nombre,' ',u2.primer_apellido)
        ELSE CONCAT(u1.primer_nombre,' ',u1.primer_apellido)
    END AS nombre_contacto,

    (
        SELECT contenido
        FROM mensajes m
        WHERE m.id_conversacion = c.id_conversacion
        ORDER BY m.fecha_envio DESC
        LIMIT 1
    ) AS ultimo_mensaje,

    (
        SELECT fecha_envio
        FROM mensajes m
        WHERE m.id_conversacion = c.id_conversacion
        ORDER BY m.fecha_envio DESC
        LIMIT 1
    ) AS ultima_fecha

FROM conversaciones c

JOIN usuarios u1
ON u1.id_usuario=c.usuario1_id

JOIN usuarios u2
ON u2.id_usuario=c.usuario2_id

WHERE
c.usuario1_id=?
OR c.usuario2_id=?

ORDER BY ultima_fecha DESC;`;

  db.query(
    sql,
    [
      id_usuario,
      id_usuario,
      id_usuario,
      id_usuario
    ],
    (err, results) => {

      if (err) {

        console.log(
          "❌ Error obteniendo conversaciones:",
          err
        );

        return res.status(500).json({
          error: "Error obteniendo conversaciones"
        });
      }

      res.json(results);
    }
  );
};