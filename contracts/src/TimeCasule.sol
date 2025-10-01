// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract TimeCapsule is ERC721, ReentrancyGuard, Ownable, Pausable {
    /*//////////////////////////////////////////////////////////////
                             CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/
    error ZeroDeposit();
    error UnlockTimeInPast();
    error InvalidBeneficiary();
    error UnauthorizedCapsuleAccess();
    error UnauthorizedUnlocker();
    error CapsuleNotReady();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    uint256 public nextTokenId;

    struct Capsule {
        uint256 btcAmount;
        uint256 unlockTimestamp;
        address beneficiary;
        address depositor;
    }

    /// tokenId => Capsule mapping
    mapping(uint256 => Capsule) public capsules;

    mapping(address => uint256[]) public depositorToCapsulesCreated;

    mapping(address => uint256[]) public beneficiaryToCapsules;
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event CapsuleCreated(
        uint256 indexed tokenId,
        address indexed depositor,
        address indexed beneficiary,
        uint256 amount,
        uint256 unlockTimestamp
    );

    event CapsuleUnlocked(
        uint256 indexed tokenId, address indexed beneficiary, uint256 indexed amount, address depositor
    );

    /*//////////////////////////////////////////////////////////////
                        STATE CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) Ownable(msg.sender) {
        nextTokenId = 1;
    }

    function deposit(address beneficiary, uint40 unlockTimestamp) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert ZeroDeposit();
        if (block.timestamp > unlockTimestamp) revert UnlockTimeInPast();
        if (beneficiary == address(0)) revert InvalidBeneficiary();

        uint256 tokenId = nextTokenId;

        _safeMint(msg.sender, tokenId);

        createCapsule(beneficiary, unlockTimestamp, tokenId);

        unchecked {
            nextTokenId++;
        }

        emit CapsuleCreated(tokenId, msg.sender, beneficiary, msg.value, unlockTimestamp);
    }

    function unlock(uint256 tokenId) external nonReentrant whenNotPaused {
        Capsule memory capsule = getCapsule(tokenId);

        if (ownerOf(tokenId) == address(0)) revert UnauthorizedCapsuleAccess();

        /// dekhna padega
        if (msg.sender != ownerOf(tokenId) && msg.sender != _getApproved(tokenId)) {
            revert UnauthorizedUnlocker();
        }
        if (capsule.unlockTimestamp > block.timestamp) revert CapsuleNotReady();

        _burn(tokenId);

        burnCapsule(capsule.beneficiary, capsule.depositor, tokenId);

        (bool success,) = capsule.beneficiary.call{value: capsule.btcAmount}("");
        if (!success) revert TransferFailed();

        emit CapsuleUnlocked(tokenId, capsule.beneficiary, capsule.btcAmount, capsule.depositor);
    }

    /// overriding to add capsule data changing functionality
    function transferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }

        address previousOwner = _update(to, tokenId, _msgSender());

        capsules[tokenId].beneficiary = to;

        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function createCapsule(address beneficiary, uint256 unlockTimestamp, uint256 tokenId) internal {
        capsules[tokenId] = Capsule({
            btcAmount: msg.value,
            unlockTimestamp: unlockTimestamp,
            beneficiary: beneficiary,
            depositor: msg.sender
        });
        depositorToCapsulesCreated[msg.sender].push(tokenId);
        beneficiaryToCapsules[beneficiary].push(tokenId);
    }

    function burnCapsule(address beneficiary, address depositor, uint256 tokenId) internal {
        delete capsules[tokenId];
        delete depositorToCapsulesCreated[depositor][tokenId];
        delete beneficiaryToCapsules[beneficiary][tokenId];
    }
    /*//////////////////////////////////////////////////////////////
                             PAUSABLE ADMIN
    //////////////////////////////////////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                             VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getCapsule(uint256 tokenId) public view returns (Capsule memory) {
        return capsules[tokenId];
    }

    function getAllBeneficiaryCapsules(address beneficiary) public view returns (Capsule[] memory caps) {
        uint256 count = beneficiaryToCapsules[beneficiary].length;
        caps = new Capsule[](count); // allocate memory with correct length

        for (uint256 i = 0; i < count; i++) {
            caps[i] = capsules[beneficiaryToCapsules[beneficiary][i]];
        }

        return caps;
    }
}
