import { ethers } from "hardhat";

const FACTORY_ADDRESS = "0x33C409E80Cd57f83f958962F77a5b127C34AD556";

const MARKETS = [
  { q: "Will Solana reach $500 before July 2027?", closes: "2027-07-01T00:00:00Z" },
  { q: "Will Ethereum reach $10,000 before the end of 2027?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will Bitcoin dominance exceed 60% before July 2027?", closes: "2027-07-01T00:00:00Z" },
  { q: "Will Coinbase stock reach $500 before the end of 2027?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will Arsenal win the 2026–27 Premier League?", closes: "2027-05-31T23:59:00Z" },
  { q: "Will Barcelona win the 2027 Champions League?", closes: "2027-06-15T23:59:00Z" },
  { q: "Will Manchester City win the 2026–27 Premier League?", closes: "2027-05-31T23:59:00Z" },
  { q: "Will the Boston Celtics win the 2027 NBA Finals?", closes: "2027-06-30T23:59:00Z" },
  { q: "Will Democrats win control of the US House in the 2026 midterms?", closes: "2026-11-15T23:59:00Z" },
  { q: "Will the US enact a federal AI law before the end of 2027?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will the Bank of England cut interest rates before 2027?", closes: "2026-12-31T23:59:00Z" },
  { q: "Will Anthropic release Claude 5 before July 2027?", closes: "2027-07-01T00:00:00Z" },
  { q: "Will SpaceX complete an orbital Starship refuelling test before 2027?", closes: "2026-12-31T23:59:00Z" },
  { q: "Will Tesla operate unsupervised robotaxis in 10 US cities before 2028?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will Apple announce a foldable iPhone before the end of 2027?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will Nvidia reach a $6 trillion market cap before 2028?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will the S&P 500 close above 7,500 before July 2027?", closes: "2027-07-01T00:00:00Z" },
  { q: "Will gold trade above $4,000 before the end of 2027?", closes: "2027-12-31T23:59:00Z" },
  { q: "Will Rockstar release GTA VI before July 2027?", closes: "2027-07-01T00:00:00Z" },
  { q: "Will Disney release Avatar 4 before 2028?", closes: "2027-12-31T23:59:00Z" },
] as const;

function toTimestamp(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

async function main() {
  const [signer] = await ethers.getSigners();
  const factory = await ethers.getContractAt("MarketFactory", FACTORY_ADDRESS);
  const admin = await factory.admin();

  if (signer.address.toLowerCase() !== admin.toLowerCase()) {
    throw new Error(
      `Configured signer ${signer.address} is not factory admin ${admin}`
    );
  }

  const balance = await ethers.provider.getBalance(signer.address);
  const existingAddresses: string[] = await factory.getAllMarkets();
  const existingQuestions = new Set<string>();

  for (const address of existingAddresses) {
    const market = await ethers.getContractAt("PredictionMarket", address);
    existingQuestions.add((await market.question()).trim().toLowerCase());
  }

  const pending = MARKETS.filter(
    ({ q }) => !existingQuestions.has(q.trim().toLowerCase())
  );

  console.log("Factory:", FACTORY_ADDRESS);
  console.log("Admin:", signer.address);
  console.log("Balance:", ethers.formatEther(balance), "AVAX");
  console.log("Existing markets:", existingAddresses.length);
  console.log("New markets:", pending.length, "\n");

  if (pending.length === 0) {
    console.log("Nothing to create. All expansion markets already exist.");
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  for (const market of pending) {
    const endTime = toTimestamp(market.closes);
    if (endTime <= now) {
      throw new Error(`Deadline is not in the future: ${market.q}`);
    }
  }

  for (let i = 0; i < pending.length; i++) {
    const market = pending[i];
    process.stdout.write(`[${i + 1}/${pending.length}] ${market.q} `);

    const tx = await factory.createMarket(
      market.q,
      toTimestamp(market.closes)
    );
    const receipt = await tx.wait();
    console.log(`✓ ${receipt?.hash.slice(0, 12)}…`);
  }

  const total = await factory.getMarketCount();
  console.log(`\nCreated ${pending.length} markets. Factory total: ${total}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
