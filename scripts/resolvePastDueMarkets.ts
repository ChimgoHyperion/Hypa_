import { ethers } from "hardhat";

/**
 * Settles past-due markets that still need an owner resolve call.
 * Outcomes below follow the 2026 World Cup results:
 *   Spain beat Argentina in the final; France lost the semi (no final);
 *   Mbappé won the Golden Boot.
 */
const RESOLUTIONS = [
  {
    market: "0xF3b8b2BEA550f0Bcd4bf849c8FB8EeB863739f6C",
    question: "Will Argentina win the 2026 FIFA World Cup?",
    outcomeYes: false,
  },
  {
    market: "0x091Ee051BC6174fD17A0FD87E729101280B95624",
    question: "Will France reach the 2026 World Cup final?",
    outcomeYes: false,
  },
  {
    market: "0x46aA17a313D8F86023668d2bB3ecFb758D6Bc486",
    question: "Will Kylian Mbappe win the 2026 Golden Boot?",
    outcomeYes: true,
  },
] as const;

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Resolver:", signer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(signer.address)),
    "AVAX\n"
  );

  for (const item of RESOLUTIONS) {
    const market = await ethers.getContractAt("PredictionMarket", item.market);
    const [question, endTime, resolved] = await market.getMarketInfo();
    const owner = await market.owner();

    console.log(`→ ${question}`);
    console.log(`  address: ${item.market}`);
    console.log(`  closed:  ${new Date(Number(endTime) * 1000).toISOString()}`);
    console.log(`  owner:   ${owner}`);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("  SKIP — signer is not the market owner\n");
      continue;
    }
    if (resolved) {
      console.log("  SKIP — already resolved\n");
      continue;
    }
    if (Number(endTime) > Math.floor(Date.now() / 1000)) {
      console.log("  SKIP — market has not ended yet\n");
      continue;
    }

    process.stdout.write(
      `  resolving as ${item.outcomeYes ? "YES" : "NO"}... `
    );
    const tx = await market.resolve(item.outcomeYes);
    const receipt = await tx.wait();
    console.log(`✓ ${receipt?.hash}\n`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
