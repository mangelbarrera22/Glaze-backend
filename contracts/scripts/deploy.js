const hre = require("hardhat");

async function main() {
  console.log("🚀 Desplegando contratos en Polygon Amoy...\n");

  // 👇 ESTA ES LA WALLET QUE VA A TENER EL ROLE
  const [deployer] = await hre.ethers.getSigners();
  const backend = deployer.address;

  console.log("🔐 Backend autorizado:", backend);

  // ==========================
  // 🪙 EmeraldCertificate
  // ==========================
  const EmeraldCertificate = await hre.ethers.getContractFactory("EmeraldCertificate");
  const emeraldCertificate = await EmeraldCertificate.deploy(backend);
  await emeraldCertificate.waitForDeployment();
  const emeraldAddress = await emeraldCertificate.getAddress();

  console.log(`✅ EmeraldCertificate: ${emeraldAddress}`);

  // ==========================
  // 💳 GlazeMarket
  // ==========================
  const GlazeMarket = await hre.ethers.getContractFactory("GlazeMarket");
  const glazeMarket = await GlazeMarket.deploy(backend);
  await glazeMarket.waitForDeployment();
  const marketAddress = await glazeMarket.getAddress();

  console.log(`✅ GlazeMarket: ${marketAddress}`);

  console.log("\n📋 Guarda en tu .env:");
  console.log(`EMERALD_CERTIFICATE_ADDRESS=${emeraldAddress}`);
  console.log(`GLAZE_MARKET_ADDRESS=${marketAddress}`);
  console.log(`BACKEND_ADDRESS=${backend}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});