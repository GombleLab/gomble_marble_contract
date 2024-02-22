pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./lib/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract LogIn is Ownable {

    using ECDSA for bytes32;

    mapping(address => uint256) public loginCount;
    address public claimOwner;
    mapping(address => mapping(uint256 => bool)) claimNonce;

    constructor(address initialOwner, address _claimOwner) public Ownable(initialOwner) {
        claimOwner = _claimOwner;
    }

    function claim(uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!claimNonce[user][nonce], 'ALREADY USED NONCE');
        _verifySignature(claimOwner, user, nonce, signature);
        loginCount[msg.sender] += 1;
        claimNonce[user][nonce] = true;
    }

    function changeClaimOwner(address newOwner) external onlyOwner {
        claimOwner = newOwner;
    }

    function _verifySignature(address owner, address sender, uint256 nonce, bytes memory signature) internal {
        bytes32 messageHash = keccak256(abi.encode(sender, nonce));
        address signer = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(signature);
        require(signer == owner, 'INVALID SIGNATURE');
    }
}
