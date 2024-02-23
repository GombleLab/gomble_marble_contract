import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks";
import 'dotenv/config'

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 56,
      forking: {
        url: "https://bsc-dataseed4.ninicoin.io/", // https://docs.bscscan.com/misc-tools-and-utilities/public-rpc-nodes
      }
    },
    bnb_mainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    bnb_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    opbnb_mainnet: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: {
      opbnb: 'https://open-platform.nodereal.io/dfa40037d4214c5c8c316e9f7119a298/op-bnb-mainnet/contract/'
    },
    customChains: [
      {
        network: "opbnb",
        chainId: 204,
        urls: {
          apiURL: "https://open-platform.nodereal.io/dfa40037d4214c5c8c316e9f7119a298/op-bnb-mainnet/contract/",
          browserURL: "https://opbnbscan.com"
        }
      }
    ]
  },
  paths: {
    tests: "./test"
  }
};

export default config;
