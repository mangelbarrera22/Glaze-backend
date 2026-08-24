/**
 * @fileoverview Controlador de autenticación y gestión de usuarios para la plataforma Glaze.
 * Maneja la verificación de nombres de usuario, el registro con encriptación de contraseñas y el inicio de sesión con JWT.
 */

const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Verificación de disponibilidad de un nombre de usuario.
 * Comprueba si un alias ya existe en la base de datos antes de permitir el registro.
 * 
 * @route GET /api/auth/verificar-usuario/:usuario
 * @param {Object} req - Objeto de solicitud de Express (contiene req.params.usuario).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Objeto indicando si el usuario está disponible (`disponible: true/false`).
 */
exports.verificarUsuario = async (req, res) => {
  const { usuario } = req.params;

  try {
    const [rows] = await db.promise().query(
      "SELECT id_usuario FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    res.json({
      disponible: rows.length === 0
    });
  } catch (error) {
    console.error("Error verificando usuario:", error);

    res.status(500).json({
      mensaje: "Error verificando usuario"
    });
  }
};

/**
 * Registro de nuevos usuarios en la plataforma.
 * Realiza la validación de campos obligatorios, verifica unicidad de usuario/correo,
 * encripta la contraseña y guarda el registro en la base de datos.
 * 
 * @route POST /api/auth/register
 * @param {Object} req - Objeto de solicitud de Express con los datos del perfil en req.body.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Confirmación de registro exitoso o mensaje de error correspondiente.
 */
exports.register = async (req, res) => {
  const {
    usuario,
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
    // 1. Validación de campos obligatorios
    if (!usuario || !primer_nombre || !primer_apellido || !correo || !password) {
      return res.status(400).json({ 
        mensaje: "Campos obligatorios incompletos" 
      });
    }

    // 2. Verificar si el nombre de usuario ya está registrado
    const [existingUsers] = await db.promise().query(
      "SELECT id_usuario FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        mensaje: "El nombre de usuario ya está en uso"
      });
    }

    // 3. Encriptar la contraseña mediante hashing con bcrypt
    const hash = await bcrypt.hash(password, 10);

    // 4. Asignación de rol por defecto si no es provisto
    const tipo = tipo_usuario || "comprador";

    // 5. Inserción en la base de datos
    const sql = `
      INSERT INTO usuarios
      (usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, celular, password, tipo_usuario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.promise().query(sql, [
      usuario,
      primer_nombre,
      segundo_nombre || null,
      primer_apellido,
      segundo_apellido || null,
      correo,
      celular || null,
      hash,
      tipo
    ]);

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario,
      tipo_usuario: tipo
    });

  } catch (error) {
    console.error("Error en el registro de usuario:", error);

    // Manejo de restricción UNIQUE de MySQL para correo duplicado
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ 
        mensaje: "El correo ya está registrado" 
      });
    }

    res.status(500).json({ 
      mensaje: "Error al registrar usuario en el servidor" 
    });
  }
};

/**
 * Inicio de sesión de usuarios.
 * Permite la autenticación mediante nombre de usuario o correo electrónico.
 * Valida la contraseña y emite un token JWT con los datos del perfil.
 * 
 * @route POST /api/auth/login
 * @param {Object} req - Objeto de solicitud con credenciales (usuario/correo y password).
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {JSON} Objeto con el token JWT de acceso y los detalles del usuario autenticado.
 */
exports.login = async (req, res) => {
  const { usuario, password } = req.body;

  // 1. Validación de campos de credenciales
  if (!usuario || !password) {
    return res.status(400).json({ 
      mensaje: "Usuario y contraseña son obligatorios" 
    });
  }

  try {
    // 2. Búsqueda del usuario por alias o por correo electrónico
    const sql = `
      SELECT * 
      FROM usuarios
      WHERE usuario = ? OR correo = ?
      LIMIT 1
    `;

    const [results] = await db.promise().query(sql, [usuario, usuario]);

    if (results.length === 0) {
      return res.status(404).json({ 
        mensaje: "Usuario no encontrado" 
      });
    }

    const user = results[0];

    // 3. Verificación de la contraseña encriptada
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ 
        mensaje: "Contraseña incorrecta" 
      });
    }

    // 4. Generación del Token JWT
    const token = jwt.sign(
      { id: user.id_usuario, tipo_usuario: user.tipo_usuario },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "8h" }
    );

    // 5. Respuesta exitosa con perfil completo del usuario
    res.json({
      token,
      usuario: {
        id_usuario: user.id_usuario,
        usuario: user.usuario,
        primer_nombre: user.primer_nombre,
        segundo_nombre: user.segundo_nombre,
        primer_apellido: user.primer_apellido,
        segundo_apellido: user.segundo_apellido,
        tipo_usuario: user.tipo_usuario,
        correo: user.correo,
        celular: user.celular
      }
    });

  } catch (error) {
    console.error("Error en el proceso de login:", error);
    res.status(500).json({ 
      mensaje: "Error en el servidor durante el inicio de sesión" 
    });
  }
};