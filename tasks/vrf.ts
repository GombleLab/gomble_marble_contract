import {task} from "hardhat/config";
import {mainnetRequestConfig, testnetRequestConfig} from "./constant";
import {VrfRequestConfig, network} from "./types";

task('request')
  .setAction(async ({}, hre) => {
    const network = hre.network.name as network;
    let config: VrfRequestConfig = getRequestConfig(network);
    const vrf = await hre.ethers.getContractAt('VRF', config.vrf);
    const result = await vrf.requestRandomWords(
      config.keyHash,
      config.subscriptionId,
      config.requestConfirmations,
      config.callbackGasLimit,
      config.numWords
    );
    console.log(`tx hash ${result.hash}`);
  });

task('changeNumWords')
  .setAction(async ({}, hre) => {
    const network = hre.network.name as network;
    let config: VrfRequestConfig = getRequestConfig(network);

    const vrf = await hre.ethers.getContractAt('VRF', config.vrf);
    const result = await vrf.changeNumWords(200);
    console.log(`tx hash ${result.hash}`);
  });

task('lastRequest')
  .setAction(async ({}, hre) => {
    const network = hre.network.name as network;
    let config: VrfRequestConfig = getRequestConfig(network);

    const vrf = await hre.ethers.getContractAt('VRF', config.vrf);
    const lastRequestId = await vrf.lastRequestId();
    console.log(await vrf.getRequestStatus(lastRequestId));
  });

task('get')
  .setAction(async ({}, hre) => {
    const network = hre.network.name as network;
    let config: VrfRequestConfig = getRequestConfig(network);

    const vrf = await hre.ethers.getContractAt('VRF', config.vrf);
    console.log(await vrf.numWords());
  });

function getRequestConfig(network: network): VrfRequestConfig {
  if (network == 'bnb_mainnet') {
    return mainnetRequestConfig;
  } else if (network == 'bnb_testnet') {
    return testnetRequestConfig;
  } else {
    throw new Error(`INVALID NETWORK ${network}`);
  }
}