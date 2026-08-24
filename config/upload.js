/**
 * @fileoverview Middleware de carga de archivos multimedia mediante Multer.
 * Configura el almacenamiento en memoria RAM para procesar y enviar directamente a Cloudinary.
 */

const multer = require("multer");

/**
 * Configuración del motor de almacenamiento en memoria para Multer.
 * Evita guardar archivos en el disco local del servidor.
 */
const storage = multer.memoryStorage();

/**
 * Instancia del middleware Multer con límite de tamaño y almacenamiento en memoria.
 */
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por archivo
});

/**
 * Exportación del middleware para ser utilizado en las rutas que procesen archivos/imágenes.
 */
module.exports = upload;