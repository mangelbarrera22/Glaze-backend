/**
 * @fileoverview Configuración e instanciación de contratos Web3 para la plataforma Glaze.
 * Conecta el backend con la red blockchain usando ethers.js v6.
 */

const { ethers } = require("ethers");

// Carga de ABIs (Application Binary Interface) de los contratos inteligentes
const EmeraldCertificateABI = require("../glaze-contracts/artifacts/contracts/EmeraldCertificate.sol/EmeraldCertificate.json").abi;
const GlazeMarketABI = require("../glaze-contracts/artifacts/contracts/GlazeMarket.sol/GlazeMarket.json").abi;

/**
 * Proveedor de conexión RPC a la red blockchain.
 * Utiliza la URL configurada en las variables de entorno.
 */
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

/**
 * Billetera (Signer) del backend con permisos de firma de transacciones.
 * Instanciada con la clave privada del servidor y conectada al proveedor RPC.
 */
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_BACKEND, provider);

/**
 * Instancia del contrato inteligente 'EmeraldCertificate'.
 * Permite interactuar con los certificados NFT / ERC-721 de las esmeraldas.
 */
const emeraldCertificate = new ethers.Contract(
  process.env.EMERALD_CERTIFICATE_ADDRESS,
  EmeraldCertificateABI,
  signer
);

/**
 * Instancia del contrato inteligente 'GlazeMarket'.
 * Maneja la lógica del mercado (compras, ventas, subastas u ofertas).
 */
const glazeMarket = new ethers.Contract(
  process.env.GLAZE_MARKET_ADDRESS,
  GlazeMarketABI,
  signer
);

/**
 * Exportación de las instancias de los contratos y el proveedor
 * para su uso en los controladores y servicios del backend.
 */
module.exports = {
  emeraldCertificate,
  glazeMarket,
  provider
};