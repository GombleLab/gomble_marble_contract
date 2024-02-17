pragma solidity ^0.8.0;

import "../lib/ERC20.sol";
import "../interfaces/IVToken.sol";
import "./ERC20Mocked.sol";
import "../lib/SafeMath.sol";

contract VTokenMocked is ERC20Mocked {
    using SafeMath for uint256;
    ERC20Mocked public _underlying;
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address underlying
    ) public ERC20Mocked(name, symbol, decimals) {
        _underlying = ERC20Mocked(underlying);
    }

    function mint(uint256 mintAmount) external returns (uint256) {
        _underlying.transferFrom(msg.sender, address(this), mintAmount);
        super.mint(msg.sender, mintAmount.mul(15000).div(10000));
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        super.burn(msg.sender, redeemTokens);
        _underlying.mint(msg.sender, redeemTokens);
    }

    function underlying() external view returns (address) {
        return address(_underlying);
    }

    function balanceOfUnderlying(address owner) external view returns (uint256) {
        return super.balanceOf(owner)
                        .mul(20000)
                        .div(30000)
                        .mul(11000)
                        .div(10000);
    }
}
