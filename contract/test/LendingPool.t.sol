// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StudentID} from "../src/StudentID.sol";
import {LendingPool} from "../src/LendingPool.sol";

contract LendingPoolTest is Test {
    StudentID sid;
    LendingPool pool;

    address admin = makeAddr("admin");
    address alice = makeAddr("alice");   // öğrenci
    address bob = makeAddr("bob");       // öğrenci (referral)
    address investor = makeAddr("investor");

    uint256 constant DEPOSIT = 1 ether;

    function setUp() public {
        vm.prank(admin);
        sid = new StudentID(admin);

        vm.prank(admin);
        pool = new LendingPool(address(sid));

        // LendingPool'u StudentID admin'i yap (temerrüt revoke için)
        vm.prank(admin);
        sid.setAdmin(address(pool), true);

        // Öğrencileri kaydet
        vm.startPrank(admin);
        sid.register(alice);
        sid.register(bob);
        vm.stopPrank();

        // Havuza likidite ekle
        vm.deal(investor, 10 ether);
        vm.prank(investor);
        pool.deposit{value: DEPOSIT}();
    }

    // ─── Deposit / Withdraw ───────────────────────────────────────────────────

    function test_Deposit() public {
        assertEq(pool.totalDeposited(), DEPOSIT);
        assertEq(pool.deposits(investor), DEPOSIT);
    }

    function test_Withdraw() public {
        uint256 before = investor.balance;
        vm.prank(investor);
        pool.withdraw(0.5 ether);
        assertEq(investor.balance, before + 0.5 ether);
        assertEq(pool.deposits(investor), 0.5 ether);
    }

    function test_RevertWithdrawExceedsDeposit() public {
        vm.prank(investor);
        vm.expectRevert(LendingPool.InsufficientDeposit.selector);
        pool.withdraw(2 ether);
    }

    // ─── Borrow ───────────────────────────────────────────────────────────────

    function test_BorrowAssignsCreditLimit() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        pool.borrow(0.005 ether, address(0));
        assertEq(pool.borrowed(alice), 0.005 ether);
        assertEq(pool.creditLimit(alice), pool.BASE_CREDIT());
    }

    function test_RevertBorrowNotStudent() public {
        address stranger = makeAddr("stranger");
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        vm.expectRevert(LendingPool.NotStudent.selector);
        pool.borrow(0.001 ether, address(0));
    }

    function test_RevertBorrowExceedsLimit() public {
        vm.prank(alice);
        vm.expectRevert(LendingPool.ExceedsCreditLimit.selector);
        pool.borrow(1 ether, address(0));
    }

    function test_RevertDoubleBorrow() public {
        vm.startPrank(alice);
        pool.borrow(0.005 ether, address(0));
        vm.expectRevert(LendingPool.AlreadyHasLoan.selector);
        pool.borrow(0.001 ether, address(0));
        vm.stopPrank();
    }

    // ─── Repay ────────────────────────────────────────────────────────────────

    function test_RepayIncreasesLimit() public {
        vm.prank(alice);
        pool.borrow(0.005 ether, address(0));

        uint256 debt = pool.currentDebt(alice);
        uint256 limitBefore = pool.creditLimit(alice);

        vm.prank(alice);
        pool.repay{value: debt}();

        assertEq(pool.borrowed(alice), 0);
        assertEq(pool.creditLimit(alice), limitBefore + pool.LIMIT_INCREMENT());
        assertEq(pool.repayCount(alice), 1);
    }

    function test_RepayRefundsExcess() public {
        vm.prank(alice);
        pool.borrow(0.005 ether, address(0));

        uint256 debt = pool.currentDebt(alice);
        uint256 overpay = debt + 0.1 ether;

        vm.deal(alice, overpay);
        uint256 before = alice.balance;
        vm.prank(alice);
        pool.repay{value: overpay}();

        assertApproxEqAbs(alice.balance, before - debt, 1e9); // küçük faiz toleransı
    }

    function test_RevertRepayNoLoan() public {
        vm.deal(alice, 0.01 ether);
        vm.prank(alice);
        vm.expectRevert(LendingPool.NoActiveLoan.selector);
        pool.repay{value: 0.01 ether}();
    }

    // ─── Faiz ─────────────────────────────────────────────────────────────────

    function test_InterestAccrues() public {
        vm.prank(alice);
        pool.borrow(0.01 ether, address(0));

        vm.warp(block.timestamp + 365 days);
        uint256 debt = pool.currentDebt(alice);
        // %5 yıllık → 0.01 ether * 1.05 = 0.0105 ether
        assertApproxEqRel(debt, 0.0105 ether, 0.01e18); // %1 tolerans
    }

    function test_NoInterestWithoutLoan() public view {
        assertEq(pool.currentDebt(alice), 0);
    }

    // ─── Referral ────────────────────────────────────────────────────────────

    function test_ReferralBonusBothSides() public {
        uint256 aliceLimit = pool.BASE_CREDIT();
        uint256 bonus = pool.REFERRAL_BONUS();

        // bob alice'i referans göstererek borrow yapıyor
        vm.prank(bob);
        pool.borrow(0.005 ether, alice);

        assertEq(pool.creditLimit(bob), aliceLimit + bonus);
        assertEq(pool.creditLimit(alice), aliceLimit + bonus);
        assertTrue(pool.referralClaimed(alice));
    }

    function test_RevertSelfReferral() public {
        // Kendini referans gösterme: bonus verilmemeli (hata değil, sessizce atlanır)
        uint256 limitBefore = pool.BASE_CREDIT();
        vm.prank(alice);
        pool.borrow(0.005 ether, alice);
        assertEq(pool.creditLimit(alice), limitBefore); // bonus yok
    }

    function test_ReferralOnlyOnce() public {
        vm.prank(bob);
        pool.borrow(0.005 ether, alice);
        uint256 debtBob = pool.currentDebt(bob);
        vm.prank(bob);
        pool.repay{value: debtBob}();

        // İkinci borrow'da alice referral zaten claimed
        address carol = makeAddr("carol");
        vm.prank(admin);
        sid.register(carol);

        uint256 aliceLimitBefore = pool.creditLimit(alice);
        vm.prank(carol);
        pool.borrow(0.005 ether, alice);
        assertEq(pool.creditLimit(alice), aliceLimitBefore); // artmadı
    }

    // ─── Temerrüt ────────────────────────────────────────────────────────────

    function test_MarkDefault() public {
        vm.prank(alice);
        pool.borrow(0.005 ether, address(0));

        vm.warp(block.timestamp + 31 days);

        vm.prank(admin);
        pool.markDefault(alice);

        assertEq(pool.creditLimit(alice), 0);
        assertFalse(sid.isRegistered(alice));
    }

    function test_RevertMarkDefaultNotOverdue() public {
        vm.prank(alice);
        pool.borrow(0.005 ether, address(0));

        vm.prank(admin);
        vm.expectRevert("not overdue");
        pool.markDefault(alice);
    }

    // ─── Fuzz ─────────────────────────────────────────────────────────────────

    function testFuzz_BorrowWithinLimit(uint256 amount) public {
        uint256 limit = pool.BASE_CREDIT();
        amount = bound(amount, 1, limit);
        vm.assume(amount <= pool.availableLiquidity());

        vm.prank(alice);
        pool.borrow(amount, address(0));
        assertEq(pool.borrowed(alice), amount);
    }
}
