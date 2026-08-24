/**
 * ==========================================================
 * Archivo: server.js
 * Proyecto: Emerald Trade / Glaze
 * Módulo: Servidor Backend
 *
 * Descripción:
 * Configuración principal del servidor Express.
 * Inicializa middlewares globales, carga las rutas de la API
 * y levanta el servidor utilizando la configuración definida
 * en las variables de entorno.
 * ==========================================================
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const os = require("os");

const app = express();


// ======================================================
// CONFIGURACIÓN DE RED
// ======================================================

/**
 * Obtiene automáticamente la dirección IP local del equipo.
 *
 * Recorre las interfaces de red disponibles y devuelve la
 * primera dirección IPv4 encontrada que no corresponda a una
 * interfaz interna.
 *
 * @returns {string} Dirección IP local del dispositivo.
 */
function getIP() {
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
}


// ======================================================
// VARIABLES DEL SERVIDOR
// ======================================================

const LOCAL_IP = getIP();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const BASE_URL = process.env.BASE_URL || `http://${LOCAL_IP}:${PORT}`;


// ======================================================
// MIDDLEWARES GLOBALES
// ======================================================
// Configuración base de Express para recibir peticiones,
// manejar JSON, formularios y archivos públicos.

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));


// ======================================================
// IMPORTACIÓN DE RUTAS
// ======================================================
// Cada módulo representa una sección de la API.

// Autenticación
const authRoutes = require("./routes/auth");

// Blockchain
const blockchainRoutes = require("./routes/blockchain");

// Compras
const comprasRoutes = require("./routes/compras");
const comprarRoutes = require("./routes/comprar");

// Comunicación
const conversacionesRoutes = require("./routes/conversaciones");
const mensajesRoutes = require("./routes/mensajes");

// Gestión del sistema
const dashboardRoutes = require("./routes/dashboard");
const soporteRoutes = require("./routes/soporte");

// Productos y usuarios
const productosRoutes = require("./routes/productos");
const usuarioRoutes = require("./routes/usuarios");
const vendedoresRoutes = require("./routes/vendedores");

// Favoritos e historial
const favoritosRoutes = require("./routes/favoritos");
const historialRoutes = require("./routes/historial");

// Pagos y ventas
const pagosRoutes = require("./routes/pagos");
const ventasRoutes = require("./routes/ventas");


// ======================================================
// REGISTRO DE RUTAS API
// ======================================================

// 🔐 Autenticación
app.use("/api/auth", authRoutes);

// 📦 Productos
app.use("/api/productos", productosRoutes);

// 💰 Ventas
app.use("/api/ventas", ventasRoutes);

// 📜 Historial
app.use("/api/historial", historialRoutes);

// 🛒 Compras
app.use("/api/compras", comprasRoutes);

// 🧾 Compra de productos
app.use("/api/comprar", comprarRoutes);

// ⭐ Favoritos
app.use("/api/favoritos", favoritosRoutes);

// 💬 Mensajes
app.use("/api/mensajes", mensajesRoutes);

// 💬 Conversaciones
app.use("/api/conversaciones", conversacionesRoutes);

// 👤 Usuarios
app.use("/api/usuarios", usuarioRoutes);

// 🏪 Vendedores
app.use("/api/vendedores", vendedoresRoutes);

// 🆘 Soporte
app.use("/api/soporte", soporteRoutes);

// 📊 Dashboard
app.use("/api/dashboard", dashboardRoutes);

// 💳 Pagos
app.use("/api/pagos", pagosRoutes);

// ⛓️ Blockchain
app.use("/api/blockchain", blockchainRoutes);


// ======================================================
// RUTA PRINCIPAL DE VERIFICACIÓN
// ======================================================

app.get("/", (req, res) => {
  res.send("API Emerald Trade funcionando 🚀");
});


// ======================================================
// INICIALIZACIÓN DEL SERVIDOR
// ======================================================

app.listen(PORT, HOST, () => {
  console.log("====================================");
  console.log("🚀 Servidor corriendo");
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`📱 Red:     ${BASE_URL}`);
  console.log("====================================");
});