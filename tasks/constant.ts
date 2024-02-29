import {ContractConfig} from "./types";

export const bnbTestnetConfig: ContractConfig = {
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

export const bnbMainnetConfig: ContractConfig = {
  logIn: {
    owner: '0xA6321CfDff2757Df53fda78C30fd6d745994B306',
    claimOwner: '0xA6321CfDff2757Df53fda78C30fd6d745994B306',
  },
  betting: {
    owner: '0xB13F45eA9330c111BE81cBe860660CA317D7fD8c',
    betOwner: '0xB13F45eA9330c111BE81cBe860660CA317D7fD8c',
    claimOwner: '0xB13F45eA9330c111BE81cBe860660CA317D7fD8c',
  },
  stake: {
    owner: '0x67448Cc9878Cee32aa05C64593Af30F53c5cAFe6',
    proxyAdmin: '0xb37A5927851F5E0E38B8D40c3Bc3E8Dd632292F8',
    treasury: '0x850fA53C201c7816DE22852EE03E0A0335453F41',
    unitroller: '0xfD36E2c2a6789Db23113685031d7F16329158384',
    vBNB: '0xA07c5b74C9B40447a954e1466938b865b6BBea36',
    bnbMinimumAmount: '100000000000000000',
    farmOwner: '0x67448Cc9878Cee32aa05C64593Af30F53c5cAFe6',
    tokens: [
      '0x55d398326f99059fF775485246999027B3197955', // USDT
      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    ],
    minimumAmounts: [
      '10000000000000000000',
      '10000000000000000000',
    ]
  }
}

export const opBnbMainnetConfig: ContractConfig = {
  logIn: {
    owner: '0xA6321CfDff2757Df53fda78C30fd6d745994B306',
    claimOwner: '0xA6321CfDff2757Df53fda78C30fd6d745994B306',
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