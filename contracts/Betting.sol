pragma solidity ^0.8.0;

import "./lib/Ownable.sol";
import "hardhat/console.sol";
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
        _claimOwner = claimOwner;
    }

    function bet(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!betNonce[user][nonce], 'ALREADY USED NONCE');
        verifySignature(betOwner, nonce, signature);
        bettingAmount[user] = bettingAmount[user] + amount;
    }

    function claim(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!claimNonce[user][nonce], 'ALREADY USED NONCE');
        verifySignature(claimOwner, nonce, signature);
        claimAmount[user] = claimAmount[user] + amount;
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

    function verifySignature(address owner, uint256 nonce, bytes memory signature) public {
        bytes32 messageHash = keccak256(abi.encodePacked(nonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        (uint8 v, bytes32 r, bytes32 s) = splitSignature(signature);
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        console.logBytes32(messageHash);
        console.logBytes32(ethSignedMessageHash);
        console.logUint(v);
        console.logBytes32(r);
        console.logBytes32(s);
        console.logBytes(signature);
        console.log('in nonce ', nonce);
        console.log('in signer ', signer);
        console.log('in owner ', owner);
        console.log(signer == owner);

        address signeraddress = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(signature);
        console.log('in signer2 ', signeraddress);

        require(signer == owner, 'INVALID SIGNATURE');
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65, "invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }
}
