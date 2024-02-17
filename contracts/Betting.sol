pragma solidity ^0.8.0;

import "./lib/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Betting is Ownable {

    using ECDSA for bytes32;

    mapping(address => uint256) bettingAmount;
    mapping(address => uint256) claimAmount;
    mapping(address => mapping(uint256 => bool)) betNonce;
    mapping(address => mapping(uint256 => bool)) claimNonce;

    address public betOwner;
    address public claimOwner;

    constructor(
        address initialOwner,
        address _betOwner,
        address _claimOwner
    ) public Ownable(initialOwner) {
        betOwner = _betOwner;
        claimOwner = _claimOwner;
    }

    function bet(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!betNonce[user][nonce], 'ALREADY USED NONCE');
        verifySignature(betOwner, nonce, amount, signature);
        bettingAmount[user] = bettingAmount[user] + amount;
        betNonce[user][nonce] = true;
    }

    function claim(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!claimNonce[user][nonce], 'ALREADY USED NONCE');
        verifySignature(claimOwner, nonce, amount, signature);
        claimAmount[user] = claimAmount[user] + amount;
        claimNonce[user][nonce] = true;
    }

    function changeBetOwner(address owner) public onlyOwner {
        betOwner = owner;
    }

    function changeClaimOwner(address owner) public onlyOwner {
        claimOwner = owner;
    }

    function getBetAmount(address user) public view returns (uint256) {
        return bettingAmount[user];
    }

    function getClaimAmount(address user) public view returns (uint256) {
        return claimAmount[user];
    }

    function verifySignature(address owner, uint256 nonce, uint256 amount, bytes memory signature) public {
        bytes32 messageHash = keccak256(abi.encode(nonce, amount));
        address signer = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(signature);
        require(signer == owner, 'INVALID SIGNATURE');
    }
}
