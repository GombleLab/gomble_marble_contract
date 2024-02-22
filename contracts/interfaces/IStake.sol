pragma solidity ^0.8.0;

interface IStake {
    function stake(address token, uint256 amount) external;

    function unstake(address token, uint256 amount) external;
}