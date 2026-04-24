const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("HEADER:", authHeader); // 🔍 DEBUG

    if (!authHeader) {
      return res.status(401).json({ error: "No autorizado - sin token" });
    }

    // 🔥 SEPARAR "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token mal formado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");

    req.user = decoded; // 🔥 AQUÍ VIENE EL ID

    console.log("USER:", decoded); // 🔍 DEBUG

    next();

  } catch (error) {
    console.log("ERROR AUTH:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
  
};