pragma solidity ^0.8.0;

import "../lib/ERC20.sol";
import "../interfaces/IVToken.sol";
import "./ERC20Mocked.sol";
import "../lib/SafeMath.sol";

contract VBnbMocked is ERC20Mocked {
    using SafeMath for uint256;
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public ERC20Mocked(name, symbol, decimals) {}

    function mint() external payable returns (uint256) {
        uint256 mintAmount = msg.value;
        super.mint(msg.sender, mintAmount.mul(15000).div(10000));
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        super.burn(msg.sender, redeemTokens.mul(15000).div(10000));
        payable(msg.sender).call{value: redeemTokens}("");
    }

    function balanceOfUnderlying(address owner) external view returns (uint256) {
        return super.balanceOf(owner).mul(11000).div(10000);
    }

    receive() external payable {}
}
