require("dotenv").config();

const express = require("express");
const cors = require("cors");
const os = require("os");

const app = express();

// ==========================
// OBTENER IP AUTOMÁTICA
// ==========================
function getIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
}

const LOCAL_IP = getIP();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const BASE_URL = process.env.BASE_URL || `http://${LOCAL_IP}:${PORT}`;

// ==========================
// MIDDLEWARES GLOBALES
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ==========================
// IMPORTAR RUTAS
// ==========================
const authRoutes = require("./routes/auth");
const productosRoutes = require("./routes/productos");
const ventasRoutes = require("./routes/ventas");
const historialRoutes = require("./routes/historial");
const comprasRoutes = require("./routes/compras");
const mensajesRoutes = require("./routes/mensajes");
const favoritosRoutes = require("./routes/favoritos");
const comprarRoutes = require("./routes/comprar");
const usuarioRoutes = require("./routes/usuarios");
const soporteRoutes = require("./routes/soporte");
const dashboardRoutes = require("./routes/dashboard");
const vendedoresRoutes = require("./routes/vendedores");
const pagosRoutes = require("./routes/pagos");
const conversacionesRoutes = require("./routes/conversaciones");
const blockchainRoutes = require("./routes/blockchain");

// ==========================
// USAR RUTAS
// ==========================

// 🔐 Auth
app.use("/api/auth", authRoutes);

// 📦 Productos
app.use("/api/productos", productosRoutes);

// 💰 Ventas
app.use("/api/ventas", ventasRoutes);

// 📜 Historial
app.use("/api/historial", historialRoutes);

// 🛒 Compras
app.use("/api/compras", comprasRoutes);

// 💬 Mensajes
app.use("/api/mensajes", mensajesRoutes);

// ⭐ Favoritos
app.use("/api/favoritos", favoritosRoutes);

// 🧾 Comprar
app.use("/api/comprar", comprarRoutes);

// 👤 Usuario
app.use("/api/usuarios", usuarioRoutes);

// 🏪 Vendedores
app.use("/api/vendedores", vendedoresRoutes);

// 🆘 Soporte
app.use("/api/soporte", soporteRoutes);

// 📊 Dashboard
app.use("/api/dashboard", dashboardRoutes);

// 💳 Pagos Wompi
app.use("/api/pagos", pagosRoutes);

// 💬 Conversaciones
app.use("/api/conversaciones", conversacionesRoutes);

// ⛓️ Blockchain
app.use("/api/blockchain", blockchainRoutes);

// ==========================
// RUTA DE PRUEBA
// ==========================
app.get("/", (req, res) => {
  res.send("API Emerald Trade funcionando 🚀");
});

// ==========================
// INICIAR SERVIDOR
// ==========================
app.listen(PORT, HOST, () => {
  console.log("====================================");
  console.log("🚀 Servidor corriendo");
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`📱 Red:     ${BASE_URL}`);
  console.log("====================================");
});