// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract MultisigFacet {
    AppStorage internal s;

    event ProposalSubmitted(uint256 indexed proposalId, address indexed proposer);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver);
    event ApprovalRevoked(uint256 indexed proposalId, address indexed approver);
    event ProposalExecuted(uint256 indexed proposalId);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event OwnerReplaced(address indexed oldOwner, address indexed newOwner);
    event RequirementChanged(uint256 required);

    function initMultisig(address[] calldata _owners, uint256 _required) external {
        require(s.multisigOwners.length == 0, "Multisig: already initialized");
        LibDiamond.enforceIsContractOwner();
        require(_owners.length >= _required && _required > 0, "Multisig: invalid params");

        for (uint256 i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Multisig: zero address");
            require(!s.isMultisigOwner[owner], "Multisig: duplicate owner");
            s.isMultisigOwner[owner] = true;
            s.multisigOwners.push(owner);
        }
        s.required = _required;
    }

    function propose(bytes calldata _callData) external returns (uint256 proposalId) {
        require(s.isMultisigOwner[msg.sender], "Multisig: not owner");
        require(_callData.length > 0, "Multisig: empty calldata");

        proposalId = s.proposalCount;
        s.proposalCount++;

        s.proposals[proposalId].proposer = msg.sender;
        s.proposals[proposalId].callData = _callData;
        s.proposals[proposalId].approvalCount = 0;
        s.proposals[proposalId].executed = false;

        emit ProposalSubmitted(proposalId, msg.sender);
    }

    function approve(uint256 _proposalId) external {
        require(s.isMultisigOwner[msg.sender], "Multisig: not owner");
        require(_proposalId < s.proposalCount, "Multisig: invalid proposal");
        require(!s.proposals[_proposalId].executed, "Multisig: already executed");
        require(!s.proposals[_proposalId].hasApproved[msg.sender], "Multisig: already approved");

        s.proposals[_proposalId].hasApproved[msg.sender] = true;
        s.proposals[_proposalId].approvalCount++;

        emit ProposalApproved(_proposalId, msg.sender);
    }

    function revokeApproval(uint256 _proposalId) external {
        require(s.isMultisigOwner[msg.sender], "Multisig: not owner");
        require(!s.proposals[_proposalId].executed, "Multisig: already executed");
        require(s.proposals[_proposalId].hasApproved[msg.sender], "Multisig: not approved");

        s.proposals[_proposalId].hasApproved[msg.sender] = false;
        s.proposals[_proposalId].approvalCount--;

        emit ApprovalRevoked(_proposalId, msg.sender);
    }

    function execute(uint256 _proposalId) external {
        require(s.isMultisigOwner[msg.sender], "Multisig: not owner");
        require(_proposalId < s.proposalCount, "Multisig: invalid proposal");
        require(!s.proposals[_proposalId].executed, "Multisig: already executed");
        require(s.proposals[_proposalId].approvalCount >= s.required, "Multisig: insufficient approvals");

        s.proposals[_proposalId].executed = true;

        (bool success, bytes memory result) = address(this).call(s.proposals[_proposalId].callData);

        if (!success) {
            if (result.length > 0) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
            revert("Multisig: execution failed");
        }

        emit ProposalExecuted(_proposalId);
    }

    function getProposal(uint256 _proposalId)
        external
        view
        returns (address proposer, bytes memory callData, uint256 approvalCount, bool executed)
    {
        require(_proposalId < s.proposalCount, "Multisig: invalid proposal");
        proposer = s.proposals[_proposalId].proposer;
        callData = s.proposals[_proposalId].callData;
        approvalCount = s.proposals[_proposalId].approvalCount;
        executed = s.proposals[_proposalId].executed;
    }

    function hasApproved(uint256 _proposalId, address _owner) external view returns (bool) {
        return s.proposals[_proposalId].hasApproved[_owner];
    }

    function getOwners() external view returns (address[] memory) {
        return s.multisigOwners;
    }

    function getRequired() external view returns (uint256) {
        return s.required;
    }

    function addOwner(address _owner) external {
        LibMultisig.enforceIsMultisig();
        require(_owner != address(0), "Multisig: zero address");
        require(!s.isMultisigOwner[_owner], "Multisig: already owner");
        s.isMultisigOwner[_owner] = true;
        s.multisigOwners.push(_owner);
        emit OwnerAdded(_owner);
    }

    function removeOwner(address _owner) external {
        LibMultisig.enforceIsMultisig();
        require(s.isMultisigOwner[_owner], "Multisig: not owner");
        require(s.multisigOwners.length > 1, "Multisig: cannot remove last owner");

        s.isMultisigOwner[_owner] = false;
        uint256 len = s.multisigOwners.length;
        for (uint256 i; i < len; i++) {
            if (s.multisigOwners[i] == _owner) {
                s.multisigOwners[i] = s.multisigOwners[len - 1];
                s.multisigOwners.pop();
                break;
            }
        }
        require(s.required <= s.multisigOwners.length, "Multisig: requirement too high");
        emit OwnerRemoved(_owner);
    }

    function replaceOwner(address _oldOwner, address _newOwner) external {
        LibMultisig.enforceIsMultisig();
        require(s.isMultisigOwner[_oldOwner], "Multisig: not owner");
        require(_newOwner != address(0), "Multisig: zero address");
        require(!s.isMultisigOwner[_newOwner], "Multisig: already owner");

        s.isMultisigOwner[_oldOwner] = false;
        s.isMultisigOwner[_newOwner] = true;
        uint256 len = s.multisigOwners.length;
        for (uint256 i; i < len; i++) {
            if (s.multisigOwners[i] == _oldOwner) {
                s.multisigOwners[i] = _newOwner;
                break;
            }
        }
        emit OwnerReplaced(_oldOwner, _newOwner);
    }

    function changeRequirement(uint256 _required) external {
        LibMultisig.enforceIsMultisig();
        require(_required > 0 && _required <= s.multisigOwners.length, "Multisig: invalid requirement");
        s.required = _required;
        emit RequirementChanged(_required);
    }
}
