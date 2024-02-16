pragma solidity ^0.8.0;

import "./interfaces/IUnitroller.sol";
import "./interfaces/IVToken.sol";
import "./interfaces/IVBnb.sol";
import "./interfaces/IERC20.sol";
import "./lib/SafeMath.sol";

contract Stake {
    using SafeMath for uint256;

    mapping (address => mapping(address => uint256)) internal _userTokenStaked; // token -> user -> staked amount
    mapping (address => uint256) internal _totalStakedAmount;  // token -> total staked amount
    mapping (address => mapping(address => uint256)) internal _cumulativeStaked; // token -> user -> cumulative amount
    mapping (address => mapping(address => uint256)) internal _whenStaked;
    mapping (address => mapping(address => uint256)) internal _whenUnstaked;
    mapping(address => uint256) internal _mmAmount; // TODO: underlying -> v token
    uint256 public constant PRECISION = 10000;
    uint constant oneWeekInSeconds = 7 days;
    address constant BNB_ADDRESS = 0x0000000000000000000000000000000000000000;
    mapping(address => address) internal _vTokenMap; // TODO: underlying -> v token

    constructor(address unitroller, address vBNB) {
        address[] memory vTokens = IUnitroller(unitroller).getAllMarkets();
        for(uint256 index = 0; index < vTokens.length; index++) {
            address vToken = vTokens[index];
            if (vToken == vBNB) {
                _vTokenMap[BNB_ADDRESS] = vToken;
                continue;
            }
            address underlying = IVToken(vToken).underlying();
            _vTokenMap[underlying] = vToken;
            IERC20(underlying).approve(vToken, type(uint256).max);
        }
    }

    function getStakedAmountOf(address token, address user) view public returns (uint256) {
        return _userTokenStaked[token][user];
    }

    function getTotalStaked(address token) view public returns (uint256) {
        return _totalStakedAmount[token];
    }

    function getUnstakedWithinOneWeek(address token, address user) view public returns (bool) {
        return (block.timestamp - _whenUnstaked[token][user]) < oneWeekInSeconds;
    }

    function getCumulativeStaked(address token, address user) view public returns (uint256) {
        return _cumulativeStaked[token][user];
    }

    function getLatestActionTime(address token, address user) view public returns (uint256) {
        uint256 whenStaked = _whenStaked[token][user];
        uint256 whenUnstaked = _whenUnstaked[token][user];

        if (whenStaked > whenUnstaked) {
            return whenStaked;
        } else {
            return whenUnstaked;
        }
    }

    function stake(address token, uint256 amount) external payable {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        address user = msg.sender;
        IERC20(token).transferFrom(user, address(this), amount);
        address vToken = _vTokenMap[token];

        if (token == BNB_ADDRESS) {
            IVBnb(vToken).mint{value: msg.value}();
        } else {
            uint error = IVToken(vToken).mint(amount);
            require(error == 0, string(abi.encodePacked('STAKE ERROR: ', error)));
        }

        _totalStakedAmount[token] = amount.add(_totalStakedAmount[token]);
        uint256 userStakedAmount = amount.add(_userTokenStaked[token][user]);
        _userTokenStaked[token][user] = userStakedAmount;
        uint256 now = block.timestamp;
        uint256 latestActionTime = getLatestActionTime(token, user);
        if (latestActionTime != 0) {
            _cumulativeStaked[token][user] = userStakedAmount.mul(
                now.sub(latestActionTime)
            );
        }
        _whenStaked[token][user] = now;
    }

    function unstake(address token, uint256 amount) external {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        address user = msg.sender;
        IVToken vToken = IVToken(_vTokenMap[token]);
        uint256 _amount = amount;
        uint256 redeemAmount;
        // to avoid stack too deep
        {
            uint256 totalStakedAmount = getTotalStaked(token);
            uint256 interest = vToken.balanceOfUnderlying(address(this)) - totalStakedAmount;
            uint256 userStakedAmount = getStakedAmountOf(token, user);
            uint256 userStakeRate = userStakedAmount
                                        .mul(PRECISION)
                                        .div(totalStakedAmount);
            uint256 userAllocatedInterest = userStakeRate
                                                .mul(interest)
                                                .div(PRECISION);
            uint256 allocatedInterest = _amount
                                            .mul(PRECISION)
                                            .div(userStakedAmount)
                                            .mul(userAllocatedInterest)
                                            .div(PRECISION);
            redeemAmount = _amount.add(allocatedInterest);
        }
        uint error = vToken.redeem(_amount);
        require(error == 0, string(abi.encodePacked('UNSTAKE ERROR: ', error)));
        _totalStakedAmount[token] = _totalStakedAmount[token].sub(_amount);
        uint256 userStakedAmount = _userTokenStaked[token][user].sub(_amount);
        _userTokenStaked[token][user] = userStakedAmount;
        uint256 now = block.timestamp;
        uint256 latestActionTime = getLatestActionTime(token, user);
        if (latestActionTime != 0) {
            _cumulativeStaked[token][user] = userStakedAmount.mul(
                now.sub(latestActionTime)
            );
        }
        _whenUnstaked[token][user] = now;
    }

    function farm(uint256 amount) external {
        _mmAmount[msg.sender] = _mmAmount[msg.sender].add(amount);
    }
}
