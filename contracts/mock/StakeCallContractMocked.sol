pragma solidity ^0.8.0;

import "../interfaces/IStake.sol";

contract StakeCallContractMocked {
    address public stakeAddress;
    constructor(
        address stake
    ) public {
        stakeAddress = stake;
    }

    function stake(address token, uint256 amount) external {
        IStake(stakeAddress).stake(token, amount);
    }

    function unstake(address token, uint256 amount) external {
        IStake(stakeAddress).unstake(token, amount);
    }
}
