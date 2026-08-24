const db = require("../config/db");
const bcrypt = require("bcrypt");

// Helper para promisificar las consultas SQL si usas el driver de callbacks
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Helper para obtener el ID de usuario desde req.user (Middleware JWT)
const getUserIdFromToken = (req) => req.user?.id || req.user?.id_usuario;

// ==========================================
// 👤 OBTENER SOCIO POR ID
// ==========================================
exports.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const authId = getUserIdFromToken(req);
    const esAdmin = req.user?.rol === "admin";

    // Control de Acceso: El usuario solo puede consultarse a sí mismo a menos que sea Admin
    if (!esAdmin && Number(id) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para acceder a esta información" });
    }

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

    const result = await queryAsync(sql, [id]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Socio no encontrado en la base de datos" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error SQL (obtenerUsuario):", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ==========================================
// ✏️ ACTUALIZAR PERFIL
// ==========================================
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const authId = getUserIdFromToken(req);
    const esAdmin = req.user?.rol === "admin";

    if (!esAdmin && Number(id) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { correo, celular, direccion } = req.body;

    if (!correo?.trim() || !celular?.trim()) {
      return res.status(400).json({ error: "El correo y celular son obligatorios" });
    }

    // Verificar duplicidad de correo omitiendo al usuario actual
    const checkEmailSql = `SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?`;
    const emailExistente = await queryAsync(checkEmailSql, [correo.trim(), id]);

    if (emailExistente.length > 0) {
      return res.status(400).json({ error: "Este correo ya pertenece a otro socio" });
    }

    const updateSql = `
      UPDATE usuarios 
      SET correo = ?, celular = ?, direccion = ?
      WHERE id_usuario = ?
    `;

    const result = await queryAsync(updateSql, [
      correo.trim(),
      celular.trim(),
      direccion?.trim() || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No se pudo encontrar al socio para actualizar" });
    }

    res.json({ message: "Perfil Glaze actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error SQL (actualizarUsuario):", err);
    res.status(500).json({ error: "Error al actualizar la base de datos" });
  }
};

// ==========================================
// 🔑 SEGURIDAD: CAMBIO DE CONTRASEÑA
// ==========================================
exports.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const authId = getUserIdFromToken(req);
    const esAdmin = req.user?.rol === "admin";

    if (!esAdmin && Number(id) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para cambiar las credenciales de este usuario" });
    }

    const { password, password_actual } = req.body;

    if (!password || !password_actual) {
      return res.status(400).json({ error: "Se requieren ambas contraseñas para validar" });
    }

    // Obtener la contraseña actual encriptada
    const sqlUser = "SELECT password FROM usuarios WHERE id_usuario = ?";
    const result = await queryAsync(sqlUser, [id]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Socio no reconocido" });
    }

    // Comparar contraseña ingresada con el hash de la DB
    const match = await bcrypt.compare(password_actual, result[0].password);
    if (!match) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }

    // Encriptar la nueva clave
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const updateSql = "UPDATE usuarios SET password = ? WHERE id_usuario = ?";
    await queryAsync(updateSql, [hashedPassword, id]);

    res.json({ message: "Credenciales actualizadas con éxito" });
  } catch (error) {
    console.error("❌ Error (cambiarPassword):", error);
    res.status(500).json({ error: "Fallo en el cifrado de seguridad o base de datos" });
  }
};

// ==========================================
// 📊 ESTADÍSTICAS (Bóveda de Inversión)
// ==========================================
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { id } = req.params;
    const authId = getUserIdFromToken(req);
    const esAdmin = req.user?.rol === "admin";

    if (!esAdmin && Number(id) !== Number(authId)) {
      return res.status(403).json({ error: "No tienes permiso para consultar estas estadísticas" });
    }

    const sql = `
      SELECT 
        COUNT(*) as total_piezas, 
        IFNULL(SUM(valor_compra), 0) as inversion_total 
      FROM ventas 
      WHERE id_comprador = ?
    `;

    const result = await queryAsync(sql, [id]);
    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error en Bóveda (obtenerEstadisticas):", err);
    res.status(500).json({ error: "Error al consultar la bóveda" });
  }
};