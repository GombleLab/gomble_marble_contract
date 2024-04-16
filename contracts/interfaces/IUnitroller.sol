pragma solidity ^0.8.0;

interface IUnitroller {
    function getAllMarkets() external view returns (address[] memory);
}
