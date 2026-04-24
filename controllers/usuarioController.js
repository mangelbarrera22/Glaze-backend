const db = require("../config/db");
const bcrypt = require("bcrypt");

// ==========================================
// OBTENER SOCIO POR ID (Con Nombre Concatenado)
// ==========================================
exports.obtenerUsuario = (req, res) => {
  // Extraemos 'id' porque así se definió en el router.get("/:id", ...)
  const { id } = req.params;

  const sql = `
    SELECT 
      id_usuario,
      correo,
      celular,
      direccion,
      TRIM(CONCAT_WS(' ', 
        NULLIF(primer_nombre, ''), 
        NULLIF(segundo_nombre, ''), 
        NULLIF(primer_apellido, ''), 
        NULLIF(segundo_apellido, '')
      )) AS nombre_completo
    FROM usuarios 
    WHERE id_usuario = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error SQL:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Socio no encontrado en la base de datos" });
    }

    // Retornamos el objeto con 'nombre_completo' listo para el Front
    res.json(result[0]);
  });
};

// ==========================================
// ACTUALIZAR PERFIL (Solo campos de contacto)
// ==========================================
exports.actualizarUsuario = (req, res) => {
  const { id } = req.params;
  const { correo, celular, direccion } = req.body;

  if (!correo || !celular) {
    return res.status(400).json({ error: "El correo y celular son obligatorios" });
  }

  // Verificamos duplicidad de correo omitiendo al usuario actual
  const checkEmailSql = `SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?`;

  db.query(checkEmailSql, [correo, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Error al verificar credenciales" });
    if (result.length > 0) return res.status(400).json({ error: "Este correo ya pertenece a otro socio" });

    const updateSql = `
      UPDATE usuarios 
      SET correo = ?, celular = ?, direccion = ?
      WHERE id_usuario = ?
    `;

    db.query(updateSql, [correo, celular, direccion, id], (err, result) => {
      if (err) return res.status(500).json({ error: "Error al actualizar la base de datos" });
      
      if (result.affectedRows === 0) return res.status(404).json({ error: "No se pudo encontrar al socio para actualizar" });

      res.json({ message: "Perfil Glaze actualizado correctamente" });
    });
  });
};

// ==========================================
// SEGURIDAD: CAMBIO DE CONTRASEÑA
// ==========================================
exports.cambiarPassword = async (req, res) => {
  const { id } = req.params;
  const { password, password_actual } = req.body;

  if (!password || !password_actual) {
    return res.status(400).json({ error: "Se requieren ambas contraseñas para validar" });
  }

  try {
    const sqlUser = "SELECT password FROM usuarios WHERE id_usuario = ?";

    db.query(sqlUser, [id], async (err, result) => {
      if (err) return res.status(500).json({ error: "Error de servidor" });
      if (result.length === 0) return res.status(404).json({ error: "Socio no reconocido" });

      // Comparación con el Hash de la DB
      const match = await bcrypt.compare(password_actual, result[0].password);
      if (!match) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta" });
      }

      // Encriptación de la nueva clave
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const updateSql = "UPDATE usuarios SET password = ? WHERE id_usuario = ?";
      db.query(updateSql, [hashedPassword, id], (err) => {
        if (err) return res.status(500).json({ error: "Error al guardar nueva clave" });
        res.json({ message: "Credenciales actualizadas con éxito" });
      });
    });
  } catch (error) {
    console.error("❌ Error Bcrypt:", error);
    res.status(500).json({ error: "Fallo en el cifrado de seguridad" });
  }
};