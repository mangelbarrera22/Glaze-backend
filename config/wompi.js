/**
 * @fileoverview Cliente HTTP para la pasarela de pagos Wompi.
 * Configura una instancia de Axios centralizada con las credenciales y URL base necesarias.
 */

const axios = require("axios");

/**
 * Instancia preconfigurada de Axios para interactuar con la API REST de Wompi.
 * Utiliza variables de entorno para la clave privada de autenticación y el endpoint base.
 */
const wompiClient = axios.create({
  baseURL: process.env.WOMPI_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    "Content-Type": "application/json"
  }
});

/**
 * Exportación del cliente HTTP configurado para realizar transacciones
 * y consultas de pago en los servicios correspondientes.
 */
module.exports = wompiClient;