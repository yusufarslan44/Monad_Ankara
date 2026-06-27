// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    // expectEmit için event'i burada yeniden bildiriyoruz (Solidity <0.8.21 sınırı)
    event Incremented(address indexed by, uint256 newValue);

    Counter counter;
    address owner = makeAddr("owner");
    address alice = makeAddr("alice");

    function setUp() public {
        vm.prank(owner);
        counter = new Counter();
    }

    function test_InitialCountIsZero() public view {
        assertEq(counter.count(), 0);
    }

    function test_OwnerSetOnDeploy() public view {
        assertEq(counter.owner(), owner);
    }

    function test_IncrementByAnyone() public {
        vm.prank(alice);
        counter.increment();
        assertEq(counter.count(), 1);
    }

    function test_IncrementEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Incremented(alice, 1);
        counter.increment();
    }

    function test_ResetByOwner() public {
        counter.increment();
        vm.prank(owner);
        counter.reset();
        assertEq(counter.count(), 0);
    }

    function test_RevertResetByNonOwner() public {
        counter.increment();
        vm.prank(alice);
        vm.expectRevert(Counter.NotOwner.selector);
        counter.reset();
    }

    function test_RevertResetWhenAlreadyZero() public {
        vm.prank(owner);
        vm.expectRevert(Counter.AlreadyReset.selector);
        counter.reset();
    }

    function testFuzz_IncrementMultipleTimes(uint8 times) public {
        for (uint256 i = 0; i < times; i++) {
            counter.increment();
        }
        assertEq(counter.count(), times);
    }
}
