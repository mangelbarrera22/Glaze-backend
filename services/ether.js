const { ethers } = require("ethers");

// 🔗 CONFIGURACIÓN
const RPC_URL = "https://rpc.ankr.com/polygon_amoy/7620e6ee630b2535beb8964e5e97d7d9641481562de17f4638d1958eba689aab"; // Polygon
const PRIVATE_KEY = "cf6e46b71c36e7e686358ec3c4c1b94afd46c134a2a810bd464f44733d35b065"; // ⚠️ cámbiala
const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
const ABI = [
  "function registrar(uint _id, string _certHash)",
  "function transferir(uint _id, address nuevo)"
];

// 🔌 CONEXIÓN
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);


// ==========================
// REGISTRAR ESMERALDA
// ==========================
const registrarEsmeralda = async (id, certificado) => {
  try {
    const tx = await contract.registrar(id, certificado);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error blockchain registro:", error);
    throw error;
  }
};


// ==========================
// TRANSFERIR ESMERALDA
// ==========================
const transferirEsmeralda = async (id, walletDestino) => {
  try {
    const tx = await contract.transferir(id, walletDestino);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error blockchain transferencia:", error);
    throw error;
  }
};

module.exports = {
  registrarEsmeralda,
  transferirEsmeralda
};