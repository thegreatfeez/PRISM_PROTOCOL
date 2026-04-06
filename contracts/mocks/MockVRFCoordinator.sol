// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockVRFCoordinator {
    uint256 public nextRequestId = 1;

    struct ExtraArgsV1 {
        bool nativePayment;
    }

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function requestRandomWords(RandomWordsRequest memory r) external returns (uint256 requestId) {
        requestId = nextRequestId++;
        uint256[] memory words = new uint256[](r.numWords);
        for (uint256 i = 0; i < r.numWords; i++) {
            words[i] = uint256(keccak256(abi.encodePacked(requestId, i)));
        }

        IVRFFulfill(msg.sender).rawFulfillRandomWords(requestId, words);
        return requestId;
    }
}

interface IVRFFulfill {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}
