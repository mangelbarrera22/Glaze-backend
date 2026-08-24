/**
 * @fileoverview Módulo de conexión a la base de datos MySQL para Glaze.
 * Utiliza la cadena de conexión URI completa para evitar bloqueos del proxy de Railway.
 */

const mysql = require("mysql2");

// Usamos la URI completa de conexión de Railway
const db = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar a Railway", err.message);
    return;
  }
  console.log("✅ ¡Conexión exitosa a la base de datos de Glaze en Railway!");
  connection.release();
});

module.exports = db;