import { ethers } from "hardhat";
import {AbiCoder} from "ethers";

export async function advanceTimeAndBlock(time: number) {
  await advanceTime(time);
  await advanceBlock();
}

export async function advanceTime(time: number) {
  await ethers.provider.send("evm_increaseTime", [time]);
}

export async function advanceBlock(count = 1) {
  for (let i = 0; i < count; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

export function makeLogInMessage(sender: string, nonce: string) {
  const encodedData = AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [sender, nonce]
  );

  const dataHash = ethers.keccak256(encodedData);


  return ethers.toBeArray(dataHash);
}

export function makeBettingMessage(sender: string, nonce: string, amount: bigint | string) {
  const encodedData = AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256"],
    [sender, nonce, amount]
  );

  const dataHash = ethers.keccak256(encodedData);


  return ethers.toBeArray(dataHash);
}

export function getRandomUint256() {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}