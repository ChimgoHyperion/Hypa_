import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const OLD_FACTORY = "0x023B2A098e093372413BF7020deBA06391e8Cf23";
const NEW_FACTORY = "0x33C409E80Cd57f83f958962F77a5b127C34AD556";
const NEW_CREATOR = "0xf38deBA0b5825d99713c935474595468BFcf5A0e";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const factory = await ethers.getContractAt("MarketFactory", NEW_FACTORY);
  const oldFactory = await ethers.getContractAt("MarketFactory", OLD_FACTORY);

  const existing = [...(await oldFactory.getAllMarkets())] as string[];
  const already = Number(await factory.getMarketCount());
  console.log("New factory markets so far:", already);
  console.log("Old factory markets:", existing.length);

  if (already < existing.length) {
    console.log("Importing markets...");
    const tx = await factory.importMarkets(existing);
    await tx.wait();
    console.log("Import tx:", tx.hash);
  } else {
    console.log("Markets already imported.");
  }

  const allowed = await factory.canCreate(NEW_CREATOR);
  if (!allowed) {
    const addTx = await factory.addCreator(NEW_CREATOR);
    await addTx.wait();
    console.log("Added creator:", NEW_CREATOR, "tx:", addTx.hash);
  } else {
    console.log("Creator already allowed:", NEW_CREATOR);
  }

  console.log("\nMarket count:", (await factory.getMarketCount()).toString());
  console.log("Admin can create:", await factory.canCreate(deployer.address));
  console.log("New address can create:", await factory.canCreate(NEW_CREATOR));

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
    `export const FACTORY_ADDRESS = '${NEW_FACTORY}' as const;`
  );
  fs.writeFileSync(contractsPath, contractsSrc);
  console.log("Updated frontend FACTORY_ADDRESS →", NEW_FACTORY);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
