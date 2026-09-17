import { ethers } from "hardhat";

async function main() {
  const FACTORY_ADDRESS = "0x256760863a2F5fa430e9Fa943a7158AD47FEEe7a";

  const factory = await ethers.getContractAt("MarketFactory", FACTORY_ADDRESS);

  const question = "TEST: Will this market resolve in 3 minutes?";
  const endTime = Math.floor(Date.now() / 1000) + 180;

  console.log("Creating fast test market...");
  console.log("Ends at:", new Date(endTime * 1000).toLocaleTimeString());

  const tx = await factory.createMarket(question, endTime, "Other");
  await tx.wait();

  const markets = await factory.getAllMarkets();
  const newMarket = markets[markets.length - 1];

  console.log("");
  console.log("Test market created!");
  console.log("Address:", newMarket);
  console.log("You have 3 minutes to bet, then you can resolve it.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
