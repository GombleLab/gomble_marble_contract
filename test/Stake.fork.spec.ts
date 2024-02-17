import {expect} from "chai";
import {ethers} from "hardhat";
import {
  ERC20,IUnitroller,
  Stake, Stake__factory,
} from "../typechain-types";
import {MAX_UINT256} from "../tasks/utils";
import type {Signer} from "ethers";
import 'dotenv/config'

const crypto = require('crypto');

describe("Stake Contract Test", function () {
  const DEFAULT_AMOUNT = 1n * (10n ** 15n); // 0.001
  const MINIMUM_AMOUNT = 1n * (10n ** 10n); // 0.0001, for test
  const UNITROLLER_ADDRESS = '0xfD36E2c2a6789Db23113685031d7F16329158384';
  const USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
  const BNB_ADDRESS = "0x0000000000000000000000000000000000000000";
  const VBNB_ADDRESS = '0xA07c5b74C9B40447a954e1466938b865b6BBea36';
  const TREASURY_ADDRESS = '0xC56895cf27CEDd5d0e8abe31E688BF2e00e9128b';
  let stake: Stake;
  let unitrollder: IUnitroller;
  let usdc: ERC20;
  const ownerAddress = '0x4Eb6b2cbC3Ad6E4a0156245F9e8880fAAaEfa394';
  let owner: Signer;
  const user1Address = '0xC007725DAc82A856d55b3B258325dbE9E994832F';
  let user1: Signer;
  const user2Address = '0x8e898826009864e6CE22a8DeD4cac925bBd2DfFc';
  let user2: Signer;
  const user3Address = '0xc092c5fB8801C3aC7ac0Ad1C323dEb05acF9535E';
  let user3: Signer;
  const user4Address = '0xE12AC531c314C0177Cc71757A151747d2FB5Db1C';
  let user4: Signer;
  beforeEach(async () => {
    const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

    await helpers.impersonateAccount(ownerAddress);
    owner = await ethers.getSigner(ownerAddress);
    await helpers.impersonateAccount(user1Address);
    user1 = await ethers.getSigner(user1Address);
    await helpers.impersonateAccount(user2Address);
    user2 = await ethers.getSigner(user2Address);
    await helpers.impersonateAccount(user3Address);
    user3 = await ethers.getSigner(user3Address);
    await helpers.impersonateAccount(user4Address);
    user4 = await ethers.getSigner(user4Address);

    unitrollder = await ethers.getContractAt('IUnitroller', UNITROLLER_ADDRESS);
    usdc = await ethers.getContractAt('ERC20', USDC_ADDRESS);

    stake = await new Stake__factory(owner).deploy(ownerAddress);
    await stake.waitForDeployment();

    await stake.initialize(
      TREASURY_ADDRESS,
      UNITROLLER_ADDRESS,
      VBNB_ADDRESS,
      MINIMUM_AMOUNT,
      [USDC_ADDRESS],
      [MINIMUM_AMOUNT]
    );

    await usdc.connect(owner).approve(await stake.getAddress(), MAX_UINT256);
    await usdc.connect(user1).approve(await stake.getAddress(), MAX_UINT256);
    await usdc.connect(user2).approve(await stake.getAddress(), MAX_UINT256);
    await usdc.connect(user3).approve(await stake.getAddress(), MAX_UINT256);
    await usdc.connect(user4).approve(await stake.getAddress(), MAX_UINT256);
  });

  describe("Stake/Unstake", function () {
    it("stake token", async function () {
      await stake.stake(USDC_ADDRESS, DEFAULT_AMOUNT);
      const totalStaked = await stake.getTotalStaked(USDC_ADDRESS);
      expect(totalStaked).to.eq(DEFAULT_AMOUNT);
      const stakedAmount = await stake.getStakedAmountOf(USDC_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(DEFAULT_AMOUNT);
    });

    it("unstake token", async function () {
      await stake.stake(USDC_ADDRESS, DEFAULT_AMOUNT);
      await increaseBlockNumber(100);

      const beforeUserAmount = await usdc.balanceOf(ownerAddress);
      const beforeTreasuryAmount = await usdc.balanceOf(TREASURY_ADDRESS);

      const tx = await stake.unstake(USDC_ADDRESS, DEFAULT_AMOUNT);
      const receipt = await tx.wait();

      const afterUserAmount = await usdc.balanceOf(ownerAddress);
      const afterTreasuryAmount = await usdc.balanceOf(TREASURY_ADDRESS);

      const totalStaked = await stake.getTotalStaked(USDC_ADDRESS);
      expect(totalStaked).to.eq(0);
      const stakedAmount = await stake.getStakedAmountOf(USDC_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(0);

      for (const log of receipt!.logs) {
        const parsedLog = Stake__factory.createInterface().parseLog(log);
        if (parsedLog?.name == 'Unstake') {
          expect(afterTreasuryAmount - beforeTreasuryAmount).to.be.eq(Array.from(parsedLog.args)[3]);
        }
      }
      expect(afterUserAmount - beforeUserAmount).to.eq(DEFAULT_AMOUNT);
    });

    it("stake bnb", async function () {
      await stake.stake(BNB_ADDRESS, DEFAULT_AMOUNT, {
        value: DEFAULT_AMOUNT
      });
      const totalStaked = await stake.getTotalStaked(BNB_ADDRESS);
      expect(totalStaked).to.eq(DEFAULT_AMOUNT);
      const stakedAmount = await stake.getStakedAmountOf(BNB_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(DEFAULT_AMOUNT);
    });

    it("unstake bnb", async function () {

      await stake.stake(BNB_ADDRESS, DEFAULT_AMOUNT, {
        value: DEFAULT_AMOUNT
      });
      await increaseBlockNumber(100);

      const beforeUserAmount = await ethers.provider.getBalance(ownerAddress);
      const beforeTreasuryAmount = await ethers.provider.getBalance(TREASURY_ADDRESS);

      const unstakeTx = await stake.unstake(BNB_ADDRESS, DEFAULT_AMOUNT);
      const unstakeReceipt = await unstakeTx.wait();
      const unstakeFee = unstakeReceipt!.gasPrice * unstakeReceipt!.gasUsed;

      const afterUserAmount = await ethers.provider.getBalance(ownerAddress);
      const afterTreasuryAmount = await ethers.provider.getBalance(TREASURY_ADDRESS);

      const totalStaked = await stake.getTotalStaked(BNB_ADDRESS);
      expect(totalStaked).to.eq(0);
      const stakedAmount = await stake.getStakedAmountOf(BNB_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(0);

      for (const log of unstakeReceipt!.logs) {
        const parsedLog = Stake__factory.createInterface().parseLog(log);
        if (parsedLog?.name == 'Unstake') {
          expect(afterTreasuryAmount - beforeTreasuryAmount).to.be.eq(Array.from(parsedLog.args)[3]);
        }
      }
      expect(afterUserAmount - beforeUserAmount + unstakeFee).to.eq(DEFAULT_AMOUNT);
    });

    it("unstake partially", async function () {
      const partialAmount = DEFAULT_AMOUNT / 3n;
      await stake.stake(USDC_ADDRESS, DEFAULT_AMOUNT);
      await increaseBlockNumber(100);

      const beforeUserAmount = await usdc.balanceOf(ownerAddress);

      await stake.unstake(USDC_ADDRESS, partialAmount);
      const afterUserPartialAmount = await usdc.balanceOf(ownerAddress);
      let totalStaked = await stake.getTotalStaked(USDC_ADDRESS);
      expect(totalStaked).to.eq(DEFAULT_AMOUNT - partialAmount);
      let stakedAmount = await stake.getStakedAmountOf(USDC_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(DEFAULT_AMOUNT - partialAmount);
      expect(afterUserPartialAmount - beforeUserAmount).to.eq(partialAmount);

      // 나머지 unstake
      await stake.unstake(USDC_ADDRESS, stakedAmount);
      const afterUserAllAmount = await usdc.balanceOf(ownerAddress);
      totalStaked = await stake.getTotalStaked(USDC_ADDRESS);
      expect(totalStaked).to.eq(0);
      stakedAmount = await stake.getStakedAmountOf(USDC_ADDRESS, ownerAddress);
      expect(stakedAmount).to.eq(0);
      expect(afterUserAllAmount - beforeUserAmount).to.eq(DEFAULT_AMOUNT);
    });

    it("N users stake and unstake token", async function () {
      const users = [owner, user1, user2, user3, user4];
      let treasuryAmount = await usdc.balanceOf(TREASURY_ADDRESS);
      for (let index = 0; index < 10; index++) {

        for (const user of users) {
          const randomAmount = randomBigIntInRange(1n * 10n ** 12n, 1n * 10n ** 13n); // 0.00001 ~ 0.0001
          await stake.connect(user).stake(USDC_ADDRESS, randomAmount);
        }
        await increaseBlockNumber(10);
        for (const user of users) {
          const stakedAmount = await stake.getStakedAmountOf(USDC_ADDRESS, await user.getAddress());
          const unstakeTx = await stake.connect(user).unstake(USDC_ADDRESS, stakedAmount);
          const unstakeReceipt = await unstakeTx.wait();
          for (const log of unstakeReceipt!.logs) {
            const parsedLog = Stake__factory.createInterface().parseLog(log);
            if (parsedLog?.name == 'Unstake') {
              treasuryAmount += Array.from(parsedLog.args)[3];
            }
          }
          await increaseBlockNumber(10);
        }

        const totalStaked = await stake.getTotalStaked(USDC_ADDRESS);
        expect(totalStaked).to.eq(0);
        expect(treasuryAmount).to.eq(await usdc.balanceOf(TREASURY_ADDRESS));
      }
    });

    it("N users stake and unstake bnb", async function () {
      const users = [owner, user1, user2, user3, user4];
      let treasuryAmount = await ethers.provider.getBalance(TREASURY_ADDRESS);
      for (let index = 0; index < 10; index++) {

        for (const user of users) {
          const randomAmount = randomBigIntInRange(1n * 10n ** 12n, 1n * 10n ** 13n); // 0.00001 ~ 0.0001
          await stake.connect(user).stake(BNB_ADDRESS, randomAmount, {
            value: randomAmount
          });
        }
        await increaseBlockNumber(10);
        for (const user of users) {
          const stakedAmount = await stake.getStakedAmountOf(BNB_ADDRESS, await user.getAddress());
          const unstakeTx = await stake.connect(user).unstake(BNB_ADDRESS, stakedAmount);
          const unstakeReceipt = await unstakeTx.wait();
          for (const log of unstakeReceipt!.logs) {
            const parsedLog = Stake__factory.createInterface().parseLog(log);
            if (parsedLog?.name == 'Unstake') {
              treasuryAmount += Array.from(parsedLog.args)[3];
            }
          }
          await increaseBlockNumber(10);
        }

        const totalStaked = await stake.getTotalStaked(BNB_ADDRESS);
        expect(totalStaked).to.eq(0);
        expect(treasuryAmount).to.eq(await ethers.provider.getBalance(TREASURY_ADDRESS));
      }
    });
  });
});

async function increaseBlockNumber(blocks: number) {
  for (let i = 0; i < blocks; i++) {
    await ethers.provider.send("evm_mine");
  }
}

function randomBigIntInRange(min: bigint, max: bigint) {
  const range = max - min;
  const rangeBytes = (range.toString(2).length + 7) / 8;
  const rangeBits = rangeBytes * 8;
  let randomNumber;

  const buffer = crypto.randomBytes(Math.ceil(rangeBits / 8));
  const hex = '0x' + buffer.toString('hex');
  randomNumber = BigInt(hex) & ((1n << BigInt(rangeBits)) - 1n);

  randomNumber = randomNumber % (range + 1n);
  return min + randomNumber;
}