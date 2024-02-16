pragma solidity ^0.8.0;

import "../interfaces/IUnitroller.sol";

contract UnitrollerMocked is IUnitroller {

    address[] public allMarkets;

    constructor(address[] memory vTokens) {
        allMarkets = vTokens;
    }

    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }
}
