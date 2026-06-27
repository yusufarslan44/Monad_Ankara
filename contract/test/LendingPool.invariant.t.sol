// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StudentID} from "../src/StudentID.sol";
import {LendingPool} from "../src/LendingPool.sol";

contract LendingPoolHandler is Test {
    LendingPool public pool;
    StudentID public sid;
    address public admin;
    address[] public students;

    constructor(LendingPool _pool, StudentID _sid, address _admin) {
        pool = _pool;
        sid = _sid;
        admin = _admin;

        for (uint256 i = 0; i < 3; i++) {
            address s = makeAddr(string(abi.encode("student", i)));
            vm.prank(admin);
            sid.register(s);
            vm.deal(s, 1 ether);
            students.push(s);
        }
    }

    function deposit(uint256 amount) public {
        amount = bound(amount, 0.001 ether, 1 ether);
        vm.deal(msg.sender, amount);
        vm.prank(msg.sender);
        pool.deposit{value: amount}();
    }

    function borrow(uint256 actorIdx, uint256 amount) public {
        address student = students[bound(actorIdx, 0, students.length - 1)];
        if (pool.borrowed(student) != 0) return;
        uint256 limit = pool.creditLimit(student) == 0
            ? pool.BASE_CREDIT()
            : pool.creditLimit(student);
        amount = bound(amount, 1, limit);
        if (amount > pool.availableLiquidity()) return;
        vm.prank(student);
        pool.borrow(amount, address(0));
    }

    function repay(uint256 actorIdx) public {
        address student = students[bound(actorIdx, 0, students.length - 1)];
        if (pool.borrowed(student) == 0) return;
        uint256 debt = pool.currentDebt(student);
        vm.deal(student, debt);
        vm.prank(student);
        pool.repay{value: debt}();
    }
}

contract LendingPoolInvariantTest is Test {
    LendingPool pool;
    StudentID sid;
    LendingPoolHandler handler;
    address admin = makeAddr("admin");

    function setUp() public {
        vm.prank(admin);
        sid = new StudentID(admin);
        vm.prank(admin);
        pool = new LendingPool(address(sid));
        vm.prank(admin);
        sid.setAdmin(address(pool), true);

        // Başlangıç likiditesi
        vm.deal(address(this), 10 ether);
        pool.deposit{value: 10 ether}();

        handler = new LendingPoolHandler(pool, sid, admin);
        targetContract(address(handler));
        excludeSender(address(pool));
        excludeSender(address(sid));
        excludeSender(address(this));
    }

    /// @notice Havuzda her zaman en az borç kadar bakiye olmalı
    function invariant_LiquidityCoversDebt() public view {
        assertGe(pool.totalDeposited(), pool.totalBorrowed());
    }

    /// @notice availableLiquidity asla negatif olamaz
    function invariant_AvailableLiquidityNonNegative() public view {
        assertGe(pool.availableLiquidity(), 0);
    }

    /// @notice Kontrat bakiyesi en az availableLiquidity kadar olmalı
    function invariant_ContractBalanceSufficient() public view {
        assertGe(address(pool).balance, pool.availableLiquidity());
    }
}
