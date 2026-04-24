const db = require("../config/db");

// ✅ ENVIAR MENSAJE
const enviarMensaje = (req, res) => {
  // Añadimos 'asunto' que viene del frontend
  const { id_usuario, asunto, mensaje } = req.body;

  if (!id_usuario || !asunto || !mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios (usuario, asunto o mensaje)" });
  }

  // Ajustamos el SQL para incluir la columna 'asunto'
  const sql = "INSERT INTO soporte (id_usuario, asunto, mensaje) VALUES (?, ?, ?)";

  db.query(sql, [id_usuario, asunto, mensaje], (err, result) => {
    if (err) {
      console.log("❌ Error en MySQL:", err);
      return res.status(500).json({ error: "Error al insertar en la base de datos" });
    }

    res.json({ 
      mensaje: "Mensaje enviado correctamente", 
      id: result.insertId 
    });
  });
};

// ✅ VER MENSAJES POR USUARIO
const obtenerMensajesUsuario = (req, res) => {
  const { id_usuario } = req.params;

  // Ordenamos por fecha para que el usuario vea lo más reciente primero
  const sql = "SELECT * FROM soporte WHERE id_usuario = ? ORDER BY fecha DESC";

  db.query(sql, [id_usuario], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error al obtener mensajes" });
    }

    res.json(results);
  });
};

// ✅ VER TODOS (ADMIN)
const obtenerTodos = (req, res) => {
  const sql = "SELECT * FROM soporte ORDER BY fecha DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error al obtener mensajes" });
    }

    res.json(results);
  });
};

// ✅ ELIMINAR MENSAJE
const eliminarMensaje = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM soporte WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error al eliminar mensaje" });
    }

    res.json({ mensaje: "Mensaje eliminado correctamente" });
  });
};

// 🔥 EXPORT CORRECTO
module.exports = {
  enviarMensaje,
  obtenerMensajesUsuario,
  obtenerTodos,
  eliminarMensaje
};