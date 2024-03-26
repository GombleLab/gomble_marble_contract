import {task} from "hardhat/config";
import {ContractConfig, network} from "./types";
import {bnbMainnetConfig, bnbTestnetConfig, opBnbMainnetConfig} from "./constant";

task('deploy-logIn')
  .setAction(async ({}, hre) => {

    const network = hre.network.name as network;
    let config: ContractConfig
    if (network == 'bnb_mainnet') {
      config = bnbMainnetConfig;
    } else if (network == 'opbnb_mainnet') {
      config = opBnbMainnetConfig;
    } else if (network == 'bnb_testnet') {
      config = bnbTestnetConfig;
    } else {
      throw new Error(`INVALID NETWORK ${network}`);
    }

    const logIn = await hre.ethers.deployContract('LogIn', [
      config.logIn.owner,
      config.logIn.claimOwner
    ]);
    await logIn.waitForDeployment();
    console.log(`LogIn deployed to ${logIn.target}`);
  });

task('deploy-betting')
  .setAction(async ({}, hre) => {

    const network = hre.network.name as network;
    let config: ContractConfig
    if (network == 'bnb_mainnet') {
      config = bnbMainnetConfig;
    } else if (network == 'bnb_testnet') {
      config = bnbTestnetConfig;
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
    if (network == 'bnb_mainnet') {
      config = bnbMainnetConfig;
    } else if (network == 'bnb_testnet') {
      config = bnbTestnetConfig;
    } else {
      throw new Error(`INVALID NETWORK ${network}`);
    }
    const proxy = await hre.ethers.deployContract('InitializableAdminUpgradeabilityProxy');
    await proxy.waitForDeployment();
    console.log(`Proxy deployed to ${proxy.target}`);

    const stakeImplementation = await hre.ethers.deployContract('Stake');
    await stakeImplementation.waitForDeployment();
    console.log(`stakeImplementation deployed to ${stakeImplementation.target}`);

    const encodedParams = stakeImplementation.interface.encodeFunctionData('initialize',[
      config.stake.owner,
      config.stake.treasury,
      config.stake.unitroller,
      config.stake.vBNB,
      config.stake.bnbMinimumAmount,
      config.stake.farmOwner,
      config.stake.tokens,
      config.stake.minimumAmounts,
    ]);

    const tx = await proxy['initialize(address,address,bytes)'](
      stakeImplementation.target,
      config.stake.proxyAdmin,
      encodedParams
    );
    await tx.wait();
    console.log(`proxy initialized at ${tx.hash}`);
  });

task('deploy-vrf')
  .setAction(async ({}, hre) => {

    const network = hre.network.name as network;
    let config: ContractConfig
    if (network == 'bnb_mainnet') {
      config = bnbMainnetConfig;
    } else if (network == 'bnb_testnet') {
      config = bnbTestnetConfig;
    } else {
      throw new Error(`INVALID NETWORK ${network}`);
    }

    const logIn = await hre.ethers.deployContract('VRF', [
      config.vrf.owner,
      config.vrf.coordinator,
    ]);
    await logIn.waitForDeployment();
    console.log(`VRF deployed to ${logIn.target}`);
  });