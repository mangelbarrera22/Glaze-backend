const { ethers } = require("ethers");

const EmeraldCertificateABI = require("../../glaze-contracts/artifacts/contracts/EmeraldCertificate.sol/EmeraldCertificate.json").abi;
const GlazeMarketABI = require("../../glaze-contracts/artifacts/contracts/GlazeMarket.sol/GlazeMarket.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// 🔐 WALLET DEL BACKEND (IMPORTANTE)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_BACKEND, provider);

// contratos
const emeraldCertificate = new ethers.Contract(
  process.env.EMERALD_CERTIFICATE_ADDRESS,
  EmeraldCertificateABI,
  signer  
);

const glazeMarket = new ethers.Contract(
  process.env.GLAZE_MARKET_ADDRESS,
  GlazeMarketABI,
  signer
);

module.exports = { emeraldCertificate, glazeMarket, provider };