// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StudentID} from "../src/StudentID.sol";

contract StudentIDTest is Test {
    event Registered(address indexed student, uint256 tokenId);
    event Revoked(address indexed student, uint256 tokenId);

    StudentID id;
    address admin = makeAddr("admin");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        vm.prank(admin);
        id = new StudentID(admin);
    }

    function test_RegisterStudent() public {
        vm.prank(admin);
        id.register(alice);
        assertTrue(id.isRegistered(alice));
        assertEq(id.ownerOf(id.studentTokenId(alice)), alice);
    }

    function test_RegisterEmitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit Registered(alice, 1);
        id.register(alice);
    }

    function test_RevertRegisterNonAdmin() public {
        vm.prank(alice);
        vm.expectRevert(StudentID.NotAdmin.selector);
        id.register(alice);
    }

    function test_RevertDoubleRegister() public {
        vm.startPrank(admin);
        id.register(alice);
        vm.expectRevert(StudentID.AlreadyRegistered.selector);
        id.register(alice);
        vm.stopPrank();
    }

    function test_RevokeStudent() public {
        vm.startPrank(admin);
        id.register(alice);
        id.revoke(alice);
        vm.stopPrank();
        assertFalse(id.isRegistered(alice));
        assertEq(id.studentTokenId(alice), 0);
    }

    function test_RevertRevokeNotRegistered() public {
        vm.prank(admin);
        vm.expectRevert(StudentID.NotRegistered.selector);
        id.revoke(alice);
    }

    function test_ReRegister() public {
        vm.startPrank(admin);
        id.register(alice);
        id.reRegister(alice, bob);
        vm.stopPrank();
        assertFalse(id.isRegistered(alice));
        assertTrue(id.isRegistered(bob));
    }

    function test_SoulboundTransferReverts() public {
        vm.prank(admin);
        id.register(alice);
        uint256 tokenId = id.studentTokenId(alice);
        vm.prank(alice);
        vm.expectRevert(StudentID.Soulbound.selector);
        id.transferFrom(alice, bob, tokenId);
    }

    function test_Locked() public {
        vm.prank(admin);
        id.register(alice);
        assertTrue(id.locked(id.studentTokenId(alice)));
    }

    function test_SupportsERC5192() public view {
        assertTrue(id.supportsInterface(0xb45a3c0e));
    }

    function test_SetAdmin() public {
        vm.prank(admin);
        id.setAdmin(alice, true);
        assertTrue(id.isAdmin(alice));
        vm.prank(alice);
        id.register(bob);
        assertTrue(id.isRegistered(bob));
    }
}
