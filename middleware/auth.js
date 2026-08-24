const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        ok: false, 
        error: "Acceso denegado. No se proporcionó un token." 
      });
    }

    // Validar el formato 'Bearer <token>' estricto
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ 
        ok: false, 
        error: "Formato de autorización inválido. Use 'Bearer <token>'" 
      });
    }

    const token = parts[1];

    // Garantizar que la clave secreta exista en producción
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurado en las variables de entorno.");
      return res.status(500).json({ 
        ok: false, 
        error: "Error de configuración interna del servidor" 
      });
    }

    // Verificar firma y tiempo de expiración
    const decoded = jwt.verify(token, secret);

    // Normalización de la estructura del payload del usuario
    const userId = decoded.id || decoded.id_usuario;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: "Token inválido: payload incompleto" 
      });
    }

    req.user = {
      ...decoded,
      id: userId,
      id_usuario: userId
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        ok: false, 
        error: "El token ha expirado. Por favor, inicia sesión nuevamente." 
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        ok: false, 
        error: "Token inválido o manipulado." 
      });
    }

    console.error("❌ Error no controlado en autenticación:", error.message);
    return res.status(401).json({ 
      ok: false, 
      error: "Fallo en la autenticación" 
    });
  }
};