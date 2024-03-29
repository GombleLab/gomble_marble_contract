import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Betting, Betting__factory,
} from "../typechain-types";
import type {Signer} from "ethers";
import {AbiCoder} from "ethers";
import {getRandomUint256, makeBettingMessage} from "./utils";

describe("Betting Contract Test", function () {
  const DEFAULT_AMOUNT = 100n * (10n ** 18n);
  let betting: Betting;
  let owner: Signer;
  let betOwner: Signer;
  let claimOwner: Signer;
  let user1: Signer;
  let user2: Signer;

  beforeEach(async () => {
    [ owner, betOwner, claimOwner, user1, user2 ] = await ethers.getSigners();
    betting = await new Betting__factory(owner).deploy(
      await owner.getAddress(),
      await betOwner.getAddress(),
      await claimOwner.getAddress(),
    );
    await betting.waitForDeployment();
  });

  describe("bet", function () {
    it("success bet", async function () {
      const nonce = getRandomUint256();
      const signature = await betOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      const beforeAmount = await betting.getBetAmount(await user1.getAddress());
      await betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature);
      const afterAmount = await betting.getBetAmount(await user1.getAddress());
      expect(beforeAmount + DEFAULT_AMOUNT).to.eq(afterAmount);
    });

    it("failed to bet with invalid signature", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to bet from another address", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(makeBettingMessage(await user2.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to bet with already used nonce", async function () {
      const nonce = getRandomUint256();
      const signature = await betOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature);
      await expect(betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('ALREADY USED NONCE');
    });
  });

  describe("claim", function () {
    it("success claim", async function () {
      const nonce = getRandomUint256();
      const signature = await claimOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      const beforeAmount = await betting.getClaimAmount(await user1.getAddress());
      await betting.connect(user1).claim(DEFAULT_AMOUNT, nonce, signature);
      const afterAmount = await betting.getClaimAmount(await user1.getAddress());
      expect(beforeAmount + DEFAULT_AMOUNT).to.eq(afterAmount);
    });

    it("failed to bet with invalid signature", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(betting.connect(user1).claim(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to bet from another address", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(makeBettingMessage(await user2.getAddress(), nonce, DEFAULT_AMOUNT));
      await expect(betting.connect(user1).claim(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to bet with already used nonce", async function () {
      const nonce = getRandomUint256();
      const signature = await claimOwner.signMessage(makeBettingMessage(await user1.getAddress(), nonce, DEFAULT_AMOUNT));
      await betting.connect(user1).claim(DEFAULT_AMOUNT, nonce, signature);
      await expect(betting.connect(user1).claim(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('ALREADY USED NONCE');
    });
  });
});
