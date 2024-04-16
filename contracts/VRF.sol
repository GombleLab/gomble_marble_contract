// SPDX-License-Identifier: MIT
// An example of a consumer contract that relies on a subscription for funding.
pragma solidity ^0.8.7;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "./lib/Ownable.sol";

contract VRF is VRFConsumerBaseV2, Ownable {
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }

    mapping(uint256 => RequestStatus) public requests;
    VRFCoordinatorV2Interface COORDINATOR;

    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    constructor(
        address owner,
        address coordinator
    )
    VRFConsumerBaseV2(coordinator)
    Ownable(owner)
    {
        COORDINATOR = VRFCoordinatorV2Interface(coordinator);
    }

    // ref: https://docs.chain.link/vrf/v2/subscription/supported-networks/#configurations
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subscriptionId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    )
    external
    onlyOwner
    returns (uint256 requestId)
    {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requests[requestId] = RequestStatus({
        randomWords : new uint256[](0),
        exists : true,
        fulfilled : false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(requests[_requestId].exists, "request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;
        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(requests[_requestId].exists, "request not found");
        RequestStatus memory request = requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
}
