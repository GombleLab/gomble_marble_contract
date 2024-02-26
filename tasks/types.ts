export interface ContractConfig {
  logIn: {
    owner: string,
    claimOwner: string,
  }
  betting: {
    owner: string,
    betOwner: string,
    claimOwner: string
  },
  stake: {
    owner: string,
    proxyAdmin: string,
    treasury: string,
    unitroller: string,
    vBNB: string,
    bnbMinimumAmount: string,
    farmOwner: string;
    tokens: string[],
    minimumAmounts: string[],
  }
}

export enum network {
  bnb_mainnet = 'bnb_mainnet',
  bnb_testnet = 'bnb_testnet',
  opbnb_mainnet = 'opbnb_mainnet',
}