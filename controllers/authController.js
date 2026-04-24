const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ======================
// REGISTER
// ======================

exports.register = async (req, res) => {
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    correo,
    celular,
    password,
    tipo_usuario
  } = req.body;

  try {
    // VALIDACIÓN
    if (!primer_nombre || !primer_apellido || !correo || !password) {
      return res.status(400).json({ mensaje: "Campos obligatorios incompletos" });
    }

    // encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    // tipo por defecto
    const tipo = tipo_usuario || "comprador";

    // generar usuario único automáticamente
    const baseUsuario = (primer_nombre + "." + primer_apellido).toLowerCase();
    const [rows] = await db.promise().query(
      "SELECT COUNT(*) as total FROM usuarios WHERE usuario LIKE ?",
      [`${baseUsuario}%`]
    );
    const total = rows[0].total;
    const usuario = total === 0 ? baseUsuario : `${baseUsuario}${total + 1}`;

    const sql = `
      INSERT INTO usuarios
      (usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, celular, password, tipo_usuario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, celular, hash, tipo],
      (err) => {
        if (err) {
          console.log(err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensaje: "El correo ya está registrado" });
          }
          return res.status(500).json({ mensaje: "Error al registrar usuario" });
        }
        res.json({
          mensaje: "Usuario registrado correctamente",
          usuario,
          tipo_usuario: tipo
        });
      }
    );

  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

// ======================
// LOGIN
// ======================

exports.login = (req, res) => {
  const { usuario, password } = req.body;

  // VALIDACIÓN
  if (!usuario || !password) {
    return res.status(400).json({ mensaje: "Usuario y contraseña son obligatorios" });
  }

  const sql = "SELECT * FROM usuarios WHERE usuario = ?";

  db.query(sql, [usuario], async (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ mensaje: "Error en el servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id_usuario, tipo_usuario: user.tipo_usuario },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: {
        id_usuario: user.id_usuario,
        usuario: user.usuario,
        tipo_usuario: user.tipo_usuario,
        nombre: `${user.primer_nombre} ${user.primer_apellido}`,
        correo: user.correo
      }
    });
  });
};