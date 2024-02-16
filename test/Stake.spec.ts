import { expect } from "chai";
import { ethers } from "hardhat";
import {
  ERC20Mocked,
  ERC20Mocked__factory,
  Stake, Stake__factory,
  UnitrollerMocked__factory, VBnbMocked, VBnbMocked__factory,
  VTokenMocked,
  VTokenMocked__factory
} from "../typechain-types";
import {MAX_UINT256} from "../tasks/utils";
import {advanceTimeAndBlock} from "./utils";

describe("Stake Contract Test", function () {
  const DEFAULT_AMOUNT = 100n * (10n ** 18n);
  let vTokenMocked: VTokenMocked;
  let vBnbMocked: VBnbMocked;
  let underlyingMocked: ERC20Mocked;
  let stake: Stake;
  let signerAddress: string;

  beforeEach(async () => {
    const [ signer ] = await ethers.getSigners();
    signerAddress = signer.address;

    // underlying
    underlyingMocked = await new ERC20Mocked__factory(signer).deploy(
      'TEST',
      'TEST TOKEN',
      18
    );
    await underlyingMocked.waitForDeployment();

    // vToken
    vTokenMocked = await new VTokenMocked__factory(signer).deploy(
      'VTEST',
      'VTEST TOKEN',
      18,
      await underlyingMocked.getAddress()
    );
    await vTokenMocked.waitForDeployment();

    // vBNB
    vBnbMocked = await new VBnbMocked__factory(signer).deploy(
      'VBNB',
      'VBNB TOKEN',
      18
    );
    await vBnbMocked.waitForDeployment();

    // unitroller
    const unitroller = await new UnitrollerMocked__factory(signer).deploy([
      await vTokenMocked.getAddress(),
      await vBnbMocked.getAddress(),
    ]);
    await unitroller.waitForDeployment();

    // stake
    stake = await new Stake__factory(signer).deploy(
      await unitroller.getAddress(),
      await vBnbMocked.getAddress(),
    );

    await underlyingMocked.mint(signerAddress, DEFAULT_AMOUNT);
    await underlyingMocked.approve(await stake.getAddress(), MAX_UINT256);
  });

  describe("Stake/Unstake", function () {
    it("stake token", async function () {
      const tokenAddress = await underlyingMocked.getAddress();

      await stake.stake(tokenAddress, DEFAULT_AMOUNT);
      const totalStaked = await stake.getTotalStaked(tokenAddress);
      expect(totalStaked).to.eq(DEFAULT_AMOUNT);
      const stakedAmount = await stake.getStakedAmountOf(tokenAddress, signerAddress);
      expect(stakedAmount).to.eq(DEFAULT_AMOUNT);
      const cumulativeStaked = await stake.getCumulativeStaked(tokenAddress, signerAddress);
      expect(cumulativeStaked).to.eq(0);
    });

    it("unstake token", async function () {
      const tokenAddress = await underlyingMocked.getAddress();

      await stake.stake(tokenAddress, DEFAULT_AMOUNT);
      await advanceTimeAndBlock(100);

      console.log(`latestActionTime ${await stake.getLatestActionTime(tokenAddress, signerAddress)}`);

      await stake.unstake(tokenAddress, DEFAULT_AMOUNT);
      const totalStaked = await stake.getTotalStaked(tokenAddress);
      expect(totalStaked).to.eq(0);
      const stakedAmount = await stake.getStakedAmountOf(tokenAddress, signerAddress);
      expect(stakedAmount).to.eq(0);
      const cumulativeStaked = await stake.getCumulativeStaked(tokenAddress, signerAddress);
      expect(cumulativeStaked).to.eq(0);
    });
  });
});
