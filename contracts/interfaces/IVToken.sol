pragma solidity ^0.8.0;

interface IVToken {
    function underlying() external view returns (address);

    function mint(uint mintAmount) external returns (uint);

    function redeem(uint redeemTokens) external returns (uint);

    function redeemUnderlying(uint redeemTokens) external returns (uint);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function balanceOfUnderlying(address owner) external returns (uint256);

    function exchangeRateStored() external view returns (uint);

    function accrueInterest() external returns (uint);
}
