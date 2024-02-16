import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Betting, Betting__factory,
  ERC20Mocked,
  ERC20Mocked__factory,
  Stake, Stake__factory,
  UnitrollerMocked__factory, VBnbMocked, VBnbMocked__factory,
  VTokenMocked,
  VTokenMocked__factory
} from "../typechain-types";
import {MAX_UINT256} from "../tasks/utils";
import {advanceTimeAndBlock} from "./utils";
import type {Signer} from "ethers";

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
    console.log(`owner ${await owner.getAddress()}`);
    console.log(`betOwner ${await betOwner.getAddress()}`);
    console.log(`claimOwner ${await claimOwner.getAddress()}`);
    betting = await new Betting__factory(owner).deploy(
      await owner.getAddress(),
      await betOwner.getAddress(),
      await claimOwner.getAddress(),
    );
    await betting.waitForDeployment();
  });

  describe("verify", () => {
    it("test", async () => {
        const nonce = getRandomUint256();
        console.log(`nonce ${nonce}`);
        console.log(`nonce ${BigInt(nonce).toString()}`);
        const signature = await betOwner.signMessage(ethers.toBeArray(nonce));
        console.log(`signature ${signature}`);

        // 서명에서 r, s, v 추출
        const r = signature.slice(0, 66);
        const s = '0x' + signature.slice(66, 130);
        const v = parseInt(signature.slice(130, 132), 16);

        console.log(`verify ${ethers.verifyMessage(ethers.toBeArray(nonce), signature)}`);
// 결과 출력
        console.log(`r: ${r}`);
        console.log(`s: ${s}`);
        console.log(`v: ${v}`);

        const messageHash = ethers.keccak256(ethers.toBeArray(nonce));
        const messageHashBytes = ethers.toBeArray(messageHash); // 바이트 배열로 변환
        const ethSignedMessageHash = ethers.keccak256(
          ethers.solidityPacked(
            ["string", "bytes32"],
            ["\x19Ethereum Signed Message:\n32", messageHashBytes]
          )
        );

        console.log(`messageHash ${messageHash}`);
        console.log(`ethSignedMessageHash ${ethSignedMessageHash}`);

        await betting.connect(betOwner).verifySignature(await betOwner.getAddress(), nonce, signature);
    })
  });

  describe.skip("bet", function () {
    it("success bet", async function () {
      const nonce = getRandomUint256();
      const signature = await betOwner.signMessage(BigInt(nonce).toString());
      const beforeAmount = await betting.getBetAmount(await user1.getAddress());
      await betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature);
      const afterAmount = await betting.getBetAmount(await user1.getAddress());
      expect(beforeAmount + DEFAULT_AMOUNT).to.eq(afterAmount);
    });

    it("failed to bet with invalid sinature", async function () {
      const nonce = getRandomUint256();
      const signature = await owner.signMessage(nonce);
      await expect(betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('INVALID SIGNATURE');
    });

    it("failed to bet with already used nonce", async function () {
      const nonce = getRandomUint256();
      const signature = await betOwner.signMessage(nonce);
      await betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature);
      await expect(betting.connect(user1).bet(DEFAULT_AMOUNT, nonce, signature)).to.be.revertedWith('ALREADY USED NONCE');
    });
  });

  describe.skip("claim", function () {
    it("claim with valid signature", async function () {
    });

    it("claim with valid signature", async function () {
    });
  });
});

function getRandomUint256() {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}
