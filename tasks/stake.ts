import {task} from "hardhat/config";
import {MAX_UINT256} from "./utils";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const STAKE_ADDRESS = '0x30e5c9E347537008268469e9F3eeB10f879A5F1C';
const TOKEN_ADDRESS = '0x4B7268FC7C727B88c5Fc127D41b491BfAe63e144';
const VTOKEN_ADDRESS = '0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8';
const AMOUNT = 1000;
const USER = '0x1BB39eaf6494A692B306B7cE2A9313516869804C';

task('approveToStake')
  .setAction(async ({}, hre) => {
    const token = await hre.ethers.getContractAt('ERC20', TOKEN_ADDRESS);
    const result = await token.approve(STAKE_ADDRESS, MAX_UINT256);
    console.log(`tx hash ${result.hash}`);
  });

task('stake')
  .setAction(async ({}, hre) => {
    const stake = await hre.ethers.getContractAt('Stake', STAKE_ADDRESS);
    const result = await stake.stake(TOKEN_ADDRESS, AMOUNT);
    console.log(`tx hash ${result.hash}`);
  });

task('unstake')
  .setAction(async ({}, hre) => {
    const stake = await hre.ethers.getContractAt('Stake', STAKE_ADDRESS);
    const result = await stake.unstake(TOKEN_ADDRESS, AMOUNT);
    console.log(`tx hash ${result.hash}`);
  });

task('balanceOfUnderlying')
  .setAction(async ({}, hre) => {
    const vToken = await hre.ethers.getContractAt('IVToken', VTOKEN_ADDRESS);
    const result = await vToken.balanceOfUnderlying(USER);
    console.log(result);
  });