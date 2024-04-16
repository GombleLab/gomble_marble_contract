pragma solidity ^0.8.0;

import "./interfaces/IUnitroller.sol";
import "./interfaces/IVToken.sol";
import "./interfaces/IVBnb.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC20Metadata.sol";
import "./lib/SafeMath.sol";
import "./lib/Ownable.sol";
import "./venus/ExponentialNoError.sol";
import "./venus/CarefulMath.sol";
import "./venus/Exponential.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Stake is OwnableUpgradeable, Exponential {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    mapping(address => mapping(address => uint256)) internal _userTokenStaked; // token -> user -> staked amount
    mapping(address => uint256) internal _totalStakedAmount;  // token -> total staked amount
    mapping(address => uint256) internal _mmAmount;
    mapping(address => uint256) internal _minimumAmount;
    uint256 public constant PRECISION = 10 ** 26;
    address constant BNB = 0x0000000000000000000000000000000000000000;
    address public vBNB;
    mapping(address => address) internal _vTokenMap;
    address[] internal _tokenList;
    IUnitroller public unitroller;
    address public treasury;

    // farm
    address public farmOwner;
    mapping(address => mapping(uint256 => bool)) farmNonce;

    // v2
    mapping(address => uint256) internal _userCurrentStakingTimestamp; // user -> current staking timestamp
    mapping(address => uint256) internal _userCurrentUnstakingTimestamp; // user -> current unstaking timestamp
    mapping(address => uint256) internal _userCurrentFarmTimestamp; // user -> current farm timestamp

    event Stake(address token, address user, uint256 amount);
    event Unstake(address token, address user, uint256 amount, uint256 treasuryAmount);
    event AddToken(address token, uint256 minimumAmount);
    event RemoveToken(address token);
    event ChangeTreasury(address _befoer, address _after);
    event ChangeFarmOwner(address _befoer, address _after);
    event ChangeMinimumAmount(address token, uint256 _befoer, uint256 _after);

    function initialize(
        address initialOwner,
        address _treasury,
        address _unitroller,
        address _vBNB,
        uint256 bnbMinimumAmount,
        address _farmOwner,
        address[] memory tokens,
        uint256[] memory minimumAmounts
    ) external initializer {
        require(tokens.length == minimumAmounts.length, 'INVALID TOKEN LENGTH');
        __Ownable_init(initialOwner);
        unitroller = IUnitroller(_unitroller);
        treasury = _treasury;
        farmOwner = _farmOwner;
        address[] memory vTokens = unitroller.getAllMarkets();
        for(uint256 index = 0; index < vTokens.length; index++) {
            address vToken = vTokens[index];
            if (vToken == _vBNB) {
                vBNB = _vBNB;
                _vTokenMap[BNB] = vToken;
                _minimumAmount[BNB] = bnbMinimumAmount;
                _tokenList.push(BNB);
                continue;
            }
            address underlying = IVToken(vToken).underlying();
            for(uint256 i = 0; i < tokens.length; i++) {
                if (underlying == tokens[i]) {
                    _tokenList.push(tokens[i]);
                    _minimumAmount[tokens[i]] = minimumAmounts[i];
                    _vTokenMap[underlying] = vToken;
                    IERC20(underlying).approve(vToken, type(uint256).max);
                }
            }
        }
    }

    function getStakedAmountOf(address token, address user) view public returns (uint256) {
        return _userTokenStaked[token][user];
    }

    function getStakedAmountOfWithoutDecimals(address token, address user) view public returns (uint256) {
        if (token == BNB) {
            return _userTokenStaked[token][user].div(10 ** 18);
        } else {
            return _userTokenStaked[token][user].div(10 ** IERC20Metadata(token).decimals());
        }
    }

    function getTotalStaked(address token) view public returns (uint256) {
        return _totalStakedAmount[token];
    }

    function stake(address token, uint256 amount) external payable {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        require(amount >= _minimumAmount[token], 'INVALID MINIMUM AMOUNT');
        address user = msg.sender;
        require(!_isContract(user), 'ONLY EOA');
        address vToken = _vTokenMap[token];
        if (token == BNB) {
            require(amount == msg.value, 'INVALID BNB AMOUNT');
            IVBnb(vToken).mint{value: msg.value}();
        } else {
            IERC20(token).transferFrom(user, address(this), amount);
            uint error = IVToken(vToken).mint(amount);
            require(error == 0, string(abi.encodePacked('STAKE ERROR: ', error)));
        }

        _totalStakedAmount[token] = amount.add(_totalStakedAmount[token]);
        uint256 userStakedAmount = amount.add(_userTokenStaked[token][user]);
        _userTokenStaked[token][user] = userStakedAmount;
        _userCurrentStakingTimestamp[user] = block.timestamp;

        emit Stake(token, user, amount);
    }

    function unstake(address token, uint256 amount) external {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        address user = msg.sender;
        require(!_isContract(user), 'ONLY EOA');
        IVToken vToken = IVToken(_vTokenMap[token]);
        uint256 _amount = amount;
        uint256 allocatedInterest;
        uint256 redeemAmount;
        vToken.accrueInterest();
        // to avoid stack too deep
        {
            uint256 totalStakedAmount = getTotalStaked(token);
            uint256 userStakedAmount = getStakedAmountOf(token, user);
            require(totalStakedAmount >= _amount, 'INVALID TOTAL AMOUNT');
            require(userStakedAmount >= _amount, 'INVALID USER AMOUNT');
            uint256 userStakeRate = userStakedAmount
                                    .mul(PRECISION)
                                    .div(totalStakedAmount);
            uint256 userAllocatedInterest = userStakeRate
                                            .mul(getInterest(token))
                                            .div(PRECISION);
            allocatedInterest = _amount
                                .mul(PRECISION)
                                .div(userStakedAmount)
                                .mul(userAllocatedInterest)
                                .div(PRECISION);
            redeemAmount = _amount.add(allocatedInterest);
        }
        uint error = vToken.redeemUnderlying(redeemAmount);
        require(error == 0, string(abi.encodePacked('UNSTAKE ERROR: ', error)));

        _totalStakedAmount[token] = _totalStakedAmount[token].sub(_amount);
        uint256 userStakedAmount = _userTokenStaked[token][user].sub(_amount);
        _userTokenStaked[token][user] = userStakedAmount;
        _userCurrentUnstakingTimestamp[user] = block.timestamp;

        if (token == BNB) {
            user.call{value: _amount}("");
            treasury.call{value: allocatedInterest}("");
        } else {
            IERC20(token).transfer(user, _amount);
            IERC20(token).transfer(treasury, allocatedInterest);
        }

        emit Unstake(token, user, amount, allocatedInterest);
    }

    function getInterest(address token) public view returns (uint256) {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        IVToken vToken = IVToken(_vTokenMap[token]);
        uint256 balanceOfUnderlying = _balanceOfUnderlying(token, address(this));
        uint256 totalStakedAmount = getTotalStaked(token);
        uint256 interest = 0;
        if (balanceOfUnderlying > totalStakedAmount) {
            interest = balanceOfUnderlying.sub(totalStakedAmount);
        }
        return interest;
    }

    function balanceOfUnderlying(address token) external view returns (uint256) {
        return _balanceOfUnderlying(token, address(this));
    }

    function balanceOf(address token) external view returns (uint256) {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        IVToken vToken = IVToken(_vTokenMap[token]);
        return vToken.balanceOf(address(this));
    }

    function addToken(address token, uint256 minimumAmount) external onlyOwner {
        require(_vTokenMap[token] == address(0), 'ALREADY REGISTERED TOKEN');
        address[] memory vTokens = unitroller.getAllMarkets();
        bool hasToken = false;
        for(uint256 index = 0; index < vTokens.length; index++) {
            address vToken = vTokens[index];
            if (vToken == vBNB) {
                continue;
            }

            address underlying = IVToken(vToken).underlying();
            if (underlying == token) {
                hasToken = true;
                _tokenList.push(token);
                _minimumAmount[token] = minimumAmount;
                _vTokenMap[underlying] = vToken;
                IERC20(underlying).approve(vToken, type(uint256).max);
            }
        }
        require(hasToken, 'HAS NO TOKEN IN MARKET');

        emit AddToken(token, minimumAmount);
    }

    function removeToken(address token) external onlyOwner {
        require(_vTokenMap[token] != address(0), 'NOT REGISTERED TOKEN');
        require(getTotalStaked(token) == 0, 'REMAINING STAKED AMOUNT');

        for(uint256 i = 0; i < _tokenList.length; i++) {
            if (_tokenList[i] == token) {
                _tokenList[i] = _tokenList[_tokenList.length - 1];
                _tokenList.pop();
                _vTokenMap[token] = address(0);
                _minimumAmount[token] = 0;
                emit RemoveToken(token);
                break;
            }
        }
    }

    function changeTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit ChangeTreasury(treasury, _treasury);
    }

    function changeFarmOwner(address newOwner) public onlyOwner {
        farmOwner = newOwner;
        emit ChangeFarmOwner(farmOwner, newOwner);
    }

    function changeMinimumAmount(address token, uint256 amount) external onlyOwner {
        require(_vTokenMap[token] != address(0), 'NOT REGISTERED TOKEN');
        uint256 beforeAmount = _minimumAmount[token];
        _minimumAmount[token] = amount;
        emit ChangeMinimumAmount(token, beforeAmount, amount);
    }

    function getMinimumAmount(address token) public view returns (uint256) {
        return _minimumAmount[token];
    }

    function getRegisteredVToken(address token) public view returns (address) {
        return _vTokenMap[token];
    }

    function getRegisteredTokens() public view returns (address[] memory) {
        return _tokenList;
    }

    function farm(uint256 amount, uint256 nonce, bytes memory signature) external {
        address user = msg.sender;
        require(!farmNonce[user][nonce], 'ALREADY USED NONCE');
        _verifySignature(farmOwner, user, nonce, amount, signature);
        _mmAmount[user] = _mmAmount[user].add(amount);
        farmNonce[user][nonce] = true;
        _userCurrentFarmTimestamp[user] = block.timestamp;
    }

    function getMMAmount(address user) external view returns (uint256) {
        return _mmAmount[user];
    }

    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        if (token == BNB) {
            _withdrawBnb(to, amount);
        } else {
            _withdrawToken(token, to, amount);
        }
    }

    function checkUserStakeToday(address user) external view returns (bool) {
        return _isToday(_userCurrentStakingTimestamp[user]);
    }

    function checkUserUnstakeToday(address user) external view returns (bool) {
        return _isToday(_userCurrentUnstakingTimestamp[user]);
    }

    function checkUserFarmToday(address user) external view returns (bool) {
        return _isToday(_userCurrentFarmTimestamp[user]);
    }

    function _isToday(uint256 timestamp) internal view returns (bool) {
        uint startOfDay = block.timestamp - (block.timestamp % 86400);
        uint endOfDay = startOfDay + 86400;
        return timestamp >= startOfDay && timestamp < endOfDay;
    }

    function _withdrawToken(address token, address to, uint256 amount) internal {
        if (amount == 0) {
            IERC20(token).transfer(
                to,
                IERC20(token).balanceOf(address(this))
            );
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    function _withdrawBnb(address to, uint256 amount) internal {
        if (amount == 0) {
            to.call{value: address(this).balance}("");
        } else {
            to.call{value: amount}("");
        }
    }

    // support for venus
    function _balanceOfUnderlying(address token, address user) internal view returns (uint256) {
        require(_vTokenMap[token] != address(0), 'INVALID TOKEN');
        IVToken vToken = IVToken(_vTokenMap[token]);
        Exp memory exchangeRate = Exp({ mantissa: vToken.exchangeRateStored() });
        (MathError mErr, uint balance) = _mulScalarTruncate(exchangeRate, vToken.balanceOf(user));
        require(mErr == MathError.NO_ERROR, "math error");
        return balance;
    }

    function _mulScalarTruncate(Exp memory a, uint scalar) internal pure returns (MathError, uint) {
        (MathError err, Exp memory product) = mulScalar(a, scalar);
        if (err != MathError.NO_ERROR) {
            return (err, 0);
        }

        return (MathError.NO_ERROR, truncate(product));
    }

    function _verifySignature(address owner, address sender, uint256 nonce, uint256 amount, bytes memory signature) internal {
        bytes32 messageHash = keccak256(abi.encode(sender, nonce, amount));
        address signer = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(signature);
        require(signer == owner, 'INVALID SIGNATURE');
    }

    function _isContract(address addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    receive() external payable {
    }
}
