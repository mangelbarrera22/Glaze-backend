/**
 * @fileoverview Middleware de carga de archivos multimedia mediante Multer.
 * Configura el almacenamiento en disco, la asignación de nombres únicos y el directorio de destino.
 */

const multer = require("multer");
const path = require("path");

/**
 * Configuración del motor de almacenamiento en disco para Multer.
 */
const storage = multer.diskStorage({
  /**
   * Define la carpeta de destino donde se guardarán los archivos subidos.
   * 
   * @param {Object} req - Objeto de solicitud HTTP.
   * @param {Object} file - Objeto que contiene la información del archivo recibido.
   * @param {Function} cb - Función de callback (error, destino).
   */
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  /**
   * Genera un nombre de archivo único utilizando la marca de tiempo actual (timestamp)
   * para prevenir sobrescritura de archivos con el mismo nombre.
   * 
   * @param {Object} req - Objeto de solicitud HTTP.
   * @param {Object} file - Objeto que contiene la información del archivo recibido.
   * @param {Function} cb - Función de callback (error, nombreArchivo).
   */
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}${extension}`);
  }
});

/**
 * Instancia del middleware Multer con la configuración de almacenamiento definida.
 */
const upload = multer({ storage });

/**
 * Exportación del middleware para ser utilizado en las rutas que procesen archivos/imágenes.
 */
module.exports = upload;