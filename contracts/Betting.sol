pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Betting is OwnableUpgradeable {

    using ECDSA for bytes32;

    struct Status {
        uint256 amount;
        uint256 count;
        uint256 currentTimestamp;
    }

    mapping(address => Status) bettingStatus;
    mapping(address => Status) claimStatus;
    mapping(address => mapping(uint256 => bool)) betNonce;
    mapping(address => mapping(uint256 => bool)) claimNonce;

    address public betOwner;
    address public claimOwner;

    event Bet(address user, uint256 amount, uint256 nonce, bytes signature);
    event Claim(address user, uint256 amount, uint256 nonce, bytes signature);

    function initialize(
        address initialOwner,
        address _betOwner,
        address _claimOwner
    ) external initializer {
        __Ownable_init(initialOwner);
        betOwner = _betOwner;
        claimOwner = _claimOwner;
    }

    function bet(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        Status storage status = bettingStatus[user];
        require(!betNonce[user][nonce], 'ALREADY USED NONCE');
        _verifySignature(betOwner, user, nonce, amount, signature);
        status.amount = status.amount + amount;
        betNonce[user][nonce] = true;
        status.count++;
        status.currentTimestamp = block.timestamp;
        bettingStatus[user] = status;
        emit Bet(user, amount, nonce, signature);
    }

    function claim(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        Status storage status = claimStatus[user];
        require(!claimNonce[user][nonce], 'ALREADY USED NONCE');
        _verifySignature(claimOwner, user, nonce, amount, signature);
        status.amount = status.amount + amount;
        claimNonce[user][nonce] = true;
        status.count++;
        status.currentTimestamp = block.timestamp;
        claimStatus[user] = status;
        emit Claim(user, amount, nonce, signature);
    }

    function changeBetOwner(address owner) public onlyOwner {
        betOwner = owner;
    }

    function changeClaimOwner(address owner) public onlyOwner {
        claimOwner = owner;
    }

    function getBetAmount(address user) public view returns (uint256) {
        return bettingStatus[user].amount;
    }

    function getBetCount(address user) public view returns (uint256) {
        return bettingStatus[user].count;
    }

    function getBetToday(address user) public view returns (bool) {
        return _isToday(bettingStatus[user].currentTimestamp);
    }

    function getClaimAmount(address user) public view returns (uint256) {
        return claimStatus[user].amount;
    }

    function getClaimCount(address user) public view returns (uint256) {
        return claimStatus[user].count;
    }

    function getClaimToday(address user) public view returns (bool) {
        return _isToday(claimStatus[user].currentTimestamp);
    }

    function _verifySignature(address owner, address sender, uint256 nonce, uint256 amount, bytes memory signature) internal {
        bytes32 messageHash = keccak256(abi.encode(sender, nonce, amount));
        address signer = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(signature);
        require(signer == owner, 'INVALID SIGNATURE');
    }

    function _isToday(uint256 timestamp) internal view returns (bool) {
        uint startOfDay = block.timestamp - (block.timestamp % 86400);
        uint endOfDay = startOfDay + 86400;
        return timestamp >= startOfDay && timestamp < endOfDay;
    }
}
