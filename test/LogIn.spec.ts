import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Betting, Betting__factory, LogIn, LogIn__factory,
} from "../typechain-types";
import type {Signer} from "ethers";
import {AbiCoder} from "ethers";
import {getRandomUint256, makeBettingMessage, makeLogInMessage} from "./utils";

describe("LogIn Contract Test", function () {
  let logIn: LogIn;
  let owner: Signer;
  let user: Signer;
  let claimOwner: Signer;

  beforeEach(async () => {
    [ owner, user, claimOwner ] = await ethers.getSigners();
    logIn = await new LogIn__factory(owner).deploy(
      await owner.getAddress(),
      await claimOwner.getAddress(),
    );
    await logIn.waitForDeployment();
  });

  describe("claim", function () {
    it("success to login", async function () {
      const nonce = getRandomUint256();
      const signature = await claimOwner.signMessage(makeLogInMessage(await owner.getAddress(), nonce));
      await logIn.claim(nonce, signature);
      const loginCount = await logIn.loginCount(await owner.getAddress());
      expect(loginCount).to.eq(1);
    });

    it("failed to login with invalid signature", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(makeLogInMessage(await owner.getAddress(), nonce));
      await expect(logIn.claim(nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to login with already used nonce", async function () {
      const nonce = getRandomUint256();
      const signature = await claimOwner.signMessage(makeLogInMessage(await owner.getAddress(), nonce));
      await logIn.claim(nonce, signature);
      await expect(logIn.claim(nonce, signature)).to.be.revertedWith('ALREADY USED NONCE');
    });

    it("failed to login from another address", async function () {
      const nonce = getRandomUint256();
      const signature = await claimOwner.signMessage(makeLogInMessage(await user.getAddress(), nonce));
      await expect(logIn.claim(nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });
  });
});
