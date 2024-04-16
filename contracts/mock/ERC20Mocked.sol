pragma solidity ^0.8.0;

import "../lib/ERC20.sol";

contract ERC20Mocked is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public ERC20(name, symbol, decimals) {}

    function mint(address user, uint256 value) public returns (bool) {
        _mint(user, value);
        return true;
    }

    function burn(address user, uint256 value) public returns (bool) {
        _burn(user, value);
        return true;
    }
}
