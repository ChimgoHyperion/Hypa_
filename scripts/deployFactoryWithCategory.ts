import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const PREVIOUS_FACTORY = "0x33C409E80Cd57f83f958962F77a5b127C34AD556";
const EXTRA_CREATOR = "0xf38deBA0b5825d99713c935474595468BFcf5A0e";

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

  const oldFactory = await ethers.getContractAt(
    "MarketFactory",
    PREVIOUS_FACTORY
  );
  const existing = [...(await oldFactory.getAllMarkets())] as string[];
  console.log("Importing", existing.length, "markets...");
  if (existing.length > 0) {
    const tx = await factory.importMarkets(existing);
    await tx.wait();
    console.log("Import tx:", tx.hash);
  }

  if (!(await factory.canCreate(EXTRA_CREATOR))) {
    const addTx = await factory.addCreator(EXTRA_CREATOR);
    await addTx.wait();
    console.log("Added creator:", EXTRA_CREATOR);
  }

  console.log("Market count:", (await factory.getMarketCount()).toString());
  console.log("Admin can create:", await factory.canCreate(deployer.address));
  console.log("Extra can create:", await factory.canCreate(EXTRA_CREATOR));

  // Refresh frontend ABIs + factory address from artifacts
  const factoryArt = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "artifacts/contracts/MarketFactory.sol/MarketFactory.json"
      ),
      "utf8"
    )
  );
  const marketArt = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "artifacts/contracts/PredictionMarket.sol/PredictionMarket.json"
      ),
      "utf8"
    )
  );

  const contractsPath = path.join(
    __dirname,
    "..",
    "frontend/app/config/contracts.ts"
  );
  const next = `// Auto-generated contract config for Hypa
export const FACTORY_ADDRESS = '${factoryAddress}' as const;

export const FACTORY_ABI = ${JSON.stringify(factoryArt.abi, null, 2)} as const;

export const MARKET_ABI = ${JSON.stringify(marketArt.abi, null, 2)} as const;
`;
  fs.writeFileSync(contractsPath, next);
  console.log("Updated frontend/app/config/contracts.ts");

  for (const file of [
    "scripts/seedMarkets.ts",
    "scripts/seedExpansionMarkets.ts",
  ]) {
    const p = path.join(__dirname, "..", file);
    let src = fs.readFileSync(p, "utf8");
    src = src.replace(
      /const FACTORY_ADDRESS = "0x[a-fA-F0-9]{40}";/,
      `const FACTORY_ADDRESS = "${factoryAddress}";`
    );
    fs.writeFileSync(p, src);
  }
  console.log("Updated seed script factory addresses");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
