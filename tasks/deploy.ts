import {task} from "hardhat/config";

const UNITROLLER = '0x94d1820b2D1c7c7452A163983Dc888CEC546b77D';
const VBNB = '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c';

task('deploy')
  .setAction(async ({}, hre) => {
    const stake = await hre.ethers.deployContract('Stake', [UNITROLLER, VBNB]);
    await stake.waitForDeployment();
    console.log(`TokenSale deployed to ${stake.target}`);
  });
