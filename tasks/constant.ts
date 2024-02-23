import {ContractConfig} from "./types";

export const testnetConfig: ContractConfig = {
  logIn: {
    owner: '0x322C2af3b801714cbDcc24622A3e8A8AeFdC0f9A',
    claimOwner: '0x322C2af3b801714cbDcc24622A3e8A8AeFdC0f9A',
  },
  betting: {
    owner: '0xF52738a1Dc7C5f70335680D3D7139b2B8fa5650E',
    betOwner: '0xF52738a1Dc7C5f70335680D3D7139b2B8fa5650E',
    claimOwner: '0xF52738a1Dc7C5f70335680D3D7139b2B8fa5650E',
  },
  stake: {
    owner: '0xB7Ea16A8A4D86320Ab668D0A7dB457eB52567568',
    proxyAdmin: '0x702a81C5ad7cc88Ab49297A69A39e8Fbd2056A0C',
    treasury: '0xCDEF7FEAa99E674297A0aCA27EB48B7db09CA9DA',
    unitroller: '0x94d1820b2D1c7c7452A163983Dc888CEC546b77D',
    vBNB: '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c',
    bnbMinimumAmount: '100000000000000000',
    farmOwner: '0xB7Ea16A8A4D86320Ab668D0A7dB457eB52567568',
    tokens: [
      '0x16227D60f7a0e586C66B005219dfc887D13C9531', // USDC
      '0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c', // USDT
    ],
    minimumAmounts: [
      '1000000',
      '1000000',
    ]
  }
}

export const mainnetConfig: ContractConfig = {
  logIn: {
    owner: '',
    claimOwner: '',
  },
  betting: {
    owner: '',
    betOwner: '',
    claimOwner: '',
  },
  stake: {
    owner: '',
    proxyAdmin: '',
    treasury: '',
    unitroller: '',
    vBNB: '',
    bnbMinimumAmount: '',
    farmOwner: '',
    tokens: [
      '', // USDC
      '', // USDT
    ],
    minimumAmounts: [
      '',
      '',
    ]
  }
}