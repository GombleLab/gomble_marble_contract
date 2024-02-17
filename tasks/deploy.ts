import {task} from "hardhat/config";
import {ContractConfig, network} from "./types";
import {mainnetConfig, testnetConfig} from "./constant";

task('deploy-betting')
  .setAction(async ({}, hre) => {

    const network = hre.network.name as network;
    let config: ContractConfig
    if (network == 'mainnet') {
      config = mainnetConfig;
    } else if (network == 'testnet') {
      config = testnetConfig;
    } else {
      throw new Error(`INVALID NETWORK ${network}`);
    }

    const betting = await hre.ethers.deployContract('Betting', [
      config.betting.owner,
      config.betting.betOwner,
      config.betting.claimOwner
    ]);
    await betting.waitForDeployment();
    console.log(`Betting deployed to ${betting.target}`);
  });

task('deploy-stake')
  .setAction(async ({}, hre) => {

    const network = hre.network.name as network;
    let config: ContractConfig
    if (network == 'mainnet') {
      config = mainnetConfig;
    } else if (network == 'testnet') {
      config = testnetConfig;
    } else {
      throw new Error(`INVALID NETWORK ${network}`);
    }

    const stake = await hre.ethers.deployContract('Stake', [config.stake.owner]);
    await stake.waitForDeployment();

    console.log(`Stake deployed to ${stake.target}`);
    const tx = await stake.initialize(
      config.stake.treasury,
      config.stake.unitroller,
      config.stake.vBNB,
      config.stake.bnbMinimumAmount,
      config.stake.farmOwner,
      config.stake.tokens,
      config.stake.minimumAmounts,
    );

    console.log(`Stake initialized at ${tx.hash}`);
  });