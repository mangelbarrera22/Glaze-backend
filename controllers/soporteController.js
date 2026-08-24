const db = require("../config/db");

// Helper para promisificar consultas
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ==========================
// ✅ ENVIAR MENSAJE DE SOPORTE
// ==========================
const enviarMensaje = async (req, res) => {
  try {
    const { asunto, mensaje } = req.body;
    // Extraer el ID seguro directamente del token de autenticación
    const id_usuario = req.user?.id || req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!asunto || !mensaje || !asunto.trim() || !mensaje.trim()) {
      return res.status(400).json({ error: "Asunto y mensaje son requeridos" });
    }

    const sql = "INSERT INTO soporte (id_usuario, asunto, mensaje, fecha) VALUES (?, ?, ?, NOW())";
    const result = await queryAsync(sql, [id_usuario, asunto.trim(), mensaje.trim()]);

    res.status(201).json({ 
      mensaje: "Mensaje enviado correctamente", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("❌ Error en MySQL (enviarMensaje):", err);
    res.status(500).json({ error: "Error interno al guardar el mensaje" });
  }
};

// ==========================
// ✅ VER MENSAJES POR USUARIO
// ==========================
const obtenerMensajesUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const usuarioAutenticado = req.user?.id || req.user?.id_usuario;
    const esAdmin = req.user?.rol === 'admin';

    // Un usuario solo puede ver sus propios tickets a menos que sea Admin
    if (!esAdmin && parseInt(id_usuario) !== parseInt(usuarioAutenticado)) {
      return res.status(403).json({ error: "No tienes permiso para ver estos mensajes" });
    }

    const sql = "SELECT * FROM soporte WHERE id_usuario = ? ORDER BY fecha DESC";
    const results = await queryAsync(sql, [id_usuario]);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en MySQL (obtenerMensajesUsuario):", err);
    res.status(500).json({ error: "Error al obtener los mensajes" });
  }
};

// ==========================
// ✅ VER TODOS LOS MENSAJES (ADMIN)
// ==========================
const obtenerTodos = async (req, res) => {
  try {
    // JOIN opcional para obtener nombre y correo del usuario que creó el ticket
    const sql = `
      SELECT 
        s.*,
        CONCAT_WS(' ', u.primer_nombre, u.primer_apellido) AS nombre_usuario,
        u.email
      FROM soporte s
      LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
      ORDER BY s.fecha DESC
    `;

    const results = await queryAsync(sql);
    res.json(results);
  } catch (err) {
    console.error("❌ Error en MySQL (obtenerTodos):", err);
    res.status(500).json({ error: "Error al obtener la lista de soporte" });
  }
};

// ==========================
// ❌ ELIMINAR MENSAJE
// ==========================
const eliminarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioAutenticado = req.user?.id || req.user?.id_usuario;
    const esAdmin = req.user?.rol === 'admin';

    // Verificar si el mensaje existe
    const mensajeExistente = await queryAsync("SELECT id_usuario FROM soporte WHERE id = ?", [id]);

    if (mensajeExistente.length === 0) {
      return res.status(404).json({ error: "El mensaje no existe" });
    }

    // Permitir eliminar solo si es el dueño del ticket o Admin
    if (!esAdmin && mensajeExistente[0].id_usuario !== usuarioAutenticado) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este mensaje" });
    }

    const sql = "DELETE FROM soporte WHERE id = ?";
    await queryAsync(sql, [id]);

    res.json({ mensaje: "Mensaje eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error en MySQL (eliminarMensaje):", err);
    res.status(500).json({ error: "Error al eliminar el mensaje" });
  }
};

module.exports = {
  enviarMensaje,
  obtenerMensajesUsuario,
  obtenerTodos,
  eliminarMensaje
};