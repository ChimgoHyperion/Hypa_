import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionMarket, MarketFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Prediction Market", function () {
  let factory: MarketFactory;
  let owner: SignerWithAddress;   // the creator/resolver
  let alice: SignerWithAddress;   // bets YES
  let bob: SignerWithAddress;     // bets NO

  beforeEach(async function () {
    // Get 3 test wallets
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy the factory
    const Factory = await ethers.getContractFactory("MarketFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("should create a market via the factory", async function () {
    // End time = 1 hour from now
    const endTime = Math.floor(Date.now() / 1000) + 3600;

    const tx = await factory.createMarket("Will BTC hit $100k?", endTime, "Crypto");
    await tx.wait();

    const count = await factory.getMarketCount();
    expect(count).to.equal(1n);

    const markets = await factory.getAllMarkets();
    console.log(" Market deployed at:", markets[0]);
  });

  it("should handle full betting, resolution, and claiming", async function () {
    const endTime = Math.floor(Date.now() / 1000) + 3600;

    // 1. Create market
    const tx = await factory.createMarket("Will ETH hit $5k?", endTime, "Crypto");
    await tx.wait();
    const markets = await factory.getAllMarkets();
    const marketAddress = markets[0];

    // 2. Connect to the deployed market
    const market = await ethers.getContractAt("PredictionMarket", marketAddress) as unknown as PredictionMarket;

    // 3. Alice bets 3 AVAX on YES
    await market.connect(alice).betYes({ value: ethers.parseEther("3") });

    // 4. Bob bets 1 AVAX on NO
    await market.connect(bob).betNo({ value: ethers.parseEther("1") });

    // Check pools
    expect(await market.totalYes()).to.equal(ethers.parseEther("3"));
    expect(await market.totalNo()).to.equal(ethers.parseEther("1"));

    // 5. Fast-forward time past endTime
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    // 6. Owner resolves market → YES wins
    await market.connect(owner).resolve(true);
    expect(await market.resolved()).to.equal(true);

    // 7. Alice claims (she bet YES and YES won)
    const balanceBefore = await ethers.provider.getBalance(alice.address);
    const claimTx = await market.connect(alice).claim();
    await claimTx.wait();
    const balanceAfter = await ethers.provider.getBalance(alice.address);

    // Alice should get back ~3.92 AVAX (her 3 + 1 from Bob, minus 2% fee)
    console.log("      ✅ Alice balance increased:", 
      ethers.formatEther(balanceAfter - balanceBefore), "AVAX (approx)");

    expect(balanceAfter).to.be.gt(balanceBefore);
  });
});

