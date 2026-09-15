import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const OLD_FACTORY = "0x023B2A098e093372413BF7020deBA06391e8Cf23";
const NEW_CREATOR = "0xf38deBA0b5825d99713c935474595468BFcf5A0e";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "AVAX\n"
  );

  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("New MarketFactory:", factoryAddress);

  // Pull every market from the previous factory so the homepage stays full
  const oldFactory = await ethers.getContractAt("MarketFactory", OLD_FACTORY);
  const existing = [...(await oldFactory.getAllMarkets())] as string[];
  console.log("Importing", existing.length, "existing markets...");

  const CHUNK = 50;
  for (let i = 0; i < existing.length; i += CHUNK) {
    const slice = existing.slice(i, i + CHUNK);
    const tx = await factory.importMarkets(slice);
    await tx.wait();
    console.log(`  imported ${Math.min(i + CHUNK, existing.length)}/${existing.length}`);
  }

  const addTx = await factory.addCreator(NEW_CREATOR);
  await addTx.wait();
  console.log("Added creator:", NEW_CREATOR);

  const count = await factory.getMarketCount();
  const canCreateNew = await factory.canCreate(NEW_CREATOR);
  const canCreateAdmin = await factory.canCreate(deployer.address);
  console.log("\nMarket count:", count.toString());
  console.log("Admin can create:", canCreateAdmin);
  console.log("New address can create:", canCreateNew);

  // Patch the frontend factory address so the app points at the new factory
  const contractsPath = path.join(
    __dirname,
    "..",
    "frontend",
    "app",
    "config",
    "contracts.ts"
  );
  let contractsSrc = fs.readFileSync(contractsPath, "utf8");
  contractsSrc = contractsSrc.replace(
    /export const FACTORY_ADDRESS = '0x[a-fA-F0-9]{40}' as const;/,
    `export const FACTORY_ADDRESS = '${factoryAddress}' as const;`
  );
  fs.writeFileSync(contractsPath, contractsSrc);
  console.log("Updated frontend FACTORY_ADDRESS →", factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
