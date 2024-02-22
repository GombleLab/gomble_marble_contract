import {expect} from "chai";
import {ethers} from "hardhat";
import {
  ERC20Mocked,
  ERC20Mocked__factory,
  Stake, Stake__factory, StakeCallContractMocked, StakeCallContractMocked__factory,
  UnitrollerMocked__factory, VBnbMocked, VBnbMocked__factory,
  VTokenMocked,
  VTokenMocked__factory
} from "../typechain-types";
import {MAX_UINT256, ZERO_ADDRESS} from "../tasks/utils";
import {advanceTimeAndBlock, getRandomUint256, makeBettingMessage} from "./utils";
import type {Signer} from "ethers";

describe("Stake Contract Test", function () {
  const DEFAULT_AMOUNT = 100n * (10n ** 18n);
  const MINIMUM_AMOUNT = 1n * (10n ** 14n); // 0.0001, for test
  let vTokenMocked1: VTokenMocked;
  let underlyingMocked1: ERC20Mocked;
  let vTokenMocked2: VTokenMocked;
  let underlyingMocked2: ERC20Mocked;
  let vBnbMocked: VBnbMocked;
  let stakeCallContractMocked: StakeCallContractMocked;
  let stake: Stake;
  let signerAddress: string;
  let signer: Signer;
  let proxyAdmin: Signer;
  let farmOwner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let user4: Signer;
  let treasury: Signer;

  beforeEach(async () => {
    [signer, proxyAdmin, farmOwner, user1, user2, user3, user4, treasury] = await ethers.getSigners();
    signerAddress = await signer.getAddress();

    underlyingMocked1 = await new ERC20Mocked__factory(signer).deploy(
      'TEST1',
      'TEST TOKEN1',
      18
    );
    await underlyingMocked1.waitForDeployment();

    vTokenMocked1 = await new VTokenMocked__factory(signer).deploy(
      'VTEST1',
      'VTEST TOKEN1',
      18,
      await underlyingMocked1.getAddress()
    );
    await vTokenMocked1.waitForDeployment();

    underlyingMocked2 = await new ERC20Mocked__factory(signer).deploy(
      'TEST2',
      'TEST TOKEN2',
      18
    );
    await underlyingMocked2.waitForDeployment();

    vTokenMocked2 = await new VTokenMocked__factory(signer).deploy(
      'VTEST2',
      'VTEST TOKEN2',
      18,
      await underlyingMocked2.getAddress()
    );
    await vTokenMocked2.waitForDeployment();

    // vBNB
    vBnbMocked = await new VBnbMocked__factory(signer).deploy(
      'VBNB',
      'VBNB TOKEN',
      18
    );
    await vBnbMocked.waitForDeployment();

    // unitroller
    const unitroller = await new UnitrollerMocked__factory(signer).deploy([
      await vTokenMocked1.getAddress(),
      await vTokenMocked2.getAddress(),
      await vBnbMocked.getAddress(),
    ]);
    await unitroller.waitForDeployment();

    const proxy = await ethers.deployContract('InitializableAdminUpgradeabilityProxy');
    await proxy.waitForDeployment();

    const stakeImplementation = await new Stake__factory(signer).deploy();
    await stakeImplementation.waitForDeployment();

    const encodedParams = stakeImplementation.interface.encodeFunctionData('initialize',[
      signerAddress,
      await treasury.getAddress(),
      await unitroller.getAddress(),
      await vBnbMocked.getAddress(),
      MINIMUM_AMOUNT,
      await farmOwner.getAddress(),
      [await underlyingMocked1.getAddress()],
      [MINIMUM_AMOUNT]
    ]);

    await proxy['initialize(address,address,bytes)'](
      stakeImplementation.target,
      await proxyAdmin.getAddress(),
      encodedParams
    );

    // stake
    stake = await ethers.getContractAt('Stake', proxy.target);

    stakeCallContractMocked = await new StakeCallContractMocked__factory(signer).deploy(await stake.getAddress());
    await stakeCallContractMocked.waitForDeployment();

    await underlyingMocked1.mint(signerAddress, DEFAULT_AMOUNT);
    await underlyingMocked1.approve(await stake.getAddress(), MAX_UINT256);

    await underlyingMocked1.mint(signerAddress, DEFAULT_AMOUNT);
    await underlyingMocked1.connect(user1).approve(await stake.getAddress(), MAX_UINT256);

    await underlyingMocked1.mint(await user1.getAddress(), DEFAULT_AMOUNT);
    await underlyingMocked1.connect(user2).approve(await stake.getAddress(), MAX_UINT256);

    await underlyingMocked1.mint(await user2.getAddress(), DEFAULT_AMOUNT);
    await underlyingMocked1.connect(user3).approve(await stake.getAddress(), MAX_UINT256);

    await underlyingMocked1.mint(await user3.getAddress(), DEFAULT_AMOUNT);
    await underlyingMocked1.connect(user4).approve(await stake.getAddress(), MAX_UINT256);
  });

  describe("miscellaneous", function () {
    it("check minimum amount", async function () {
      const tokenAddress = await underlyingMocked1.getAddress();
      const minimumAmount = await stake.getMinimumAmount(tokenAddress);
      await expect(stake.stake(tokenAddress, minimumAmount / 10n)).to.be.revertedWith('INVALID MINIMUM AMOUNT');
    });

    it("add token", async function () {
      const tokenAddress = await underlyingMocked2.getAddress();
      const beforeTokenList = await stake.getRegisteredTokens();
      await stake.addToken(tokenAddress, MINIMUM_AMOUNT);
      const afterTokenList = await stake.getRegisteredTokens();

      expect(beforeTokenList.length).to.be.eq(2);
      expect(beforeTokenList.includes(tokenAddress)).to.be.false;
      expect(afterTokenList.length).to.be.eq(3);
      expect(afterTokenList.includes(tokenAddress)).to.be.true;
      expect(await stake.getMinimumAmount(tokenAddress)).to.be.eq(MINIMUM_AMOUNT);
      expect(await stake.getRegisteredVToken(tokenAddress)).to.be.eq(await vTokenMocked2.getAddress());
    });

    it("remove token", async function () {
      const tokenAddress = await underlyingMocked2.getAddress();
      await stake.addToken(tokenAddress, MINIMUM_AMOUNT);
      const beforeTokenList = await stake.getRegisteredTokens();
      await stake.removeToken(tokenAddress);
      const afterTokenList = await stake.getRegisteredTokens();

      expect(beforeTokenList.length).to.be.eq(3);
      expect(beforeTokenList.includes(tokenAddress)).to.be.true;
      expect(afterTokenList.length).to.be.eq(2);
      expect(afterTokenList.includes(tokenAddress)).to.be.false;
      expect(await stake.getMinimumAmount(tokenAddress)).to.be.eq(0);
      expect(await stake.getRegisteredVToken(tokenAddress)).to.be.eq(ZERO_ADDRESS);
    });

    it("remove failed when staked amount remained", async function () {
      const tokenAddress = await underlyingMocked2.getAddress();
      await stake.addToken(tokenAddress, MINIMUM_AMOUNT);
      await underlyingMocked2.mint(signerAddress, DEFAULT_AMOUNT);
      await underlyingMocked2.approve(await stake.getAddress(), MAX_UINT256);
      await stake.stake(tokenAddress, DEFAULT_AMOUNT);
      await expect(stake.removeToken(tokenAddress)).to.be.revertedWith('REMAINING STAKED AMOUNT');
    });

    it("farm", async function() {
      const nonce = getRandomUint256();
      const signature = await farmOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await stake.connect(user1).farm(DEFAULT_AMOUNT, nonce, signature);
      const mmAmount = await stake.getMMAmount(await user1.getAddress());
      expect(mmAmount).to.be.eq(DEFAULT_AMOUNT);
    });

    it("farm, invalid signature", async function() {
      const nonce = getRandomUint256();
      const signature = await user1.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(stake.connect(user1).farm(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("farm, from another address", async function() {
      const nonce = getRandomUint256();
      const signature = await farmOwner.signMessage(makeBettingMessage(await user2.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(stake.connect(user1).farm(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("farm, used nonce", async function() {
      const nonce = getRandomUint256();
      const signature = await farmOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await stake.connect(user1).farm(DEFAULT_AMOUNT, nonce, signature);
      await expect(stake.connect(user1).farm(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('ALREADY USED NONCE');
    });

    it("cannot stake from CA", async function() {
      await expect(stakeCallContractMocked.stake(
        await underlyingMocked1.getAddress(),
        DEFAULT_AMOUNT
      )).to.be.revertedWith('ONLY EOA');
    });

    it("cannot unstake from CA", async function() {
      await expect(stakeCallContractMocked.unstake(
        await underlyingMocked1.getAddress(),
        DEFAULT_AMOUNT
      )).to.be.revertedWith('ONLY EOA');
    });
  });
});
