// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title StudentID — ERC-5192 uyumlu Soulbound kampüs kimliği
contract StudentID is ERC721 {
    error NotAdmin();
    error AlreadyRegistered();
    error NotRegistered();
    error Soulbound();

    event Registered(address indexed student, uint256 tokenId);
    event Revoked(address indexed student, uint256 tokenId);
    event AdminUpdated(address indexed account, bool status);

    mapping(address => bool) public isAdmin;
    mapping(address => uint256) public studentTokenId;

    uint256 private _nextTokenId = 1;

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert NotAdmin();
        _;
    }

    constructor(address admin) ERC721("CampusID", "CAMPID") {
        isAdmin[admin] = true;
        emit AdminUpdated(admin, true);
    }

    /// @notice .edu.tr doğrulaması backend tarafından yapıldıktan sonra admin çağırır
    function register(address student) public onlyAdmin {
        if (isRegistered(student)) revert AlreadyRegistered();
        uint256 tokenId = _nextTokenId++;
        studentTokenId[student] = tokenId;
        _safeMint(student, tokenId);
        emit Registered(student, tokenId);
    }

    /// @notice Temerrüt veya kötüye kullanım durumunda kimliği iptal eder
    function revoke(address student) public onlyAdmin {
        if (!isRegistered(student)) revert NotRegistered();
        uint256 tokenId = studentTokenId[student];
        studentTokenId[student] = 0;
        _burn(tokenId);
        emit Revoked(student, tokenId);
    }

    /// @notice Cüzdan kaybı: eski kimliği iptal et, yeni cüzdana yeni token bas
    function reRegister(address oldStudent, address newStudent) external onlyAdmin {
        if (!isRegistered(oldStudent)) revert NotRegistered();
        if (isRegistered(newStudent)) revert AlreadyRegistered();
        revoke(oldStudent);
        register(newStudent);
    }

    function setAdmin(address account, bool status) external onlyAdmin {
        isAdmin[account] = status;
        emit AdminUpdated(account, status);
    }

    function isRegistered(address student) public view returns (bool) {
        return studentTokenId[student] != 0;
    }

    /// @notice ERC-5192: token her zaman kilitlidir
    function locked(uint256 /*tokenId*/) external pure returns (bool) {
        return true;
    }

    /// @dev Soulbound: mint (from=0) ve burn (to=0) dışında transfer yasak
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        // ERC-5192 interfaceId: 0xb45a3c0e
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
