// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {StudentID} from "./StudentID.sol";

/// @title LendingPool — Teminatsız kampüs nano-lending havuzu (native MON)
contract LendingPool is ReentrancyGuard {
    error NotOwner();
    error NotStudent();
    error ZeroAmount();
    error AlreadyHasLoan();
    error NoActiveLoan();
    error ExceedsCreditLimit();
    error InsufficientLiquidity();
    error InsufficientDeposit();
    error SelfReferral();

    event Deposited(address indexed by, uint256 amount);
    event Withdrawn(address indexed by, uint256 amount);
    event Borrowed(address indexed student, uint256 amount, uint256 creditLimit);
    event Repaid(address indexed student, uint256 principal, uint256 interest);
    event ReferralBonusGranted(address indexed referrer, address indexed referee, uint256 bonus);
    event CreditLimitUpdated(address indexed student, uint256 newLimit);
    event DefaultMarked(address indexed student, uint256 debt);

    StudentID public immutable studentID;
    address public owner;

    // Havuz
    uint256 public totalDeposited;
    uint256 public totalBorrowed;

    // Yatırımcı bakiyeleri
    mapping(address => uint256) public deposits;

    // Öğrenci borç durumu
    mapping(address => uint256) public borrowed;
    mapping(address => uint256) public borrowedAt;
    mapping(address => uint256) public creditLimit;
    mapping(address => uint256) public repayCount;

    // Referral
    mapping(address => bool) public referralClaimed;

    // Parametreler
    uint256 public BASE_CREDIT = 0.01 ether;
    uint256 public LIMIT_INCREMENT = 0.005 ether;
    uint256 public REFERRAL_BONUS = 0.002 ether;
    uint256 public ANNUAL_RATE_BPS = 500; // %5
    uint256 public MAX_BORROW_DURATION = 30 days;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyStudent() {
        if (!studentID.isRegistered(msg.sender)) revert NotStudent();
        _;
    }

    constructor(address _studentID) {
        studentID = StudentID(_studentID);
        owner = msg.sender;
    }

    // ─── Yatırımcı ───────────────────────────────────────────────────────────

    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        deposits[msg.sender] += msg.value;
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (deposits[msg.sender] < amount) revert InsufficientDeposit();
        if (availableLiquidity() < amount) revert InsufficientLiquidity();

        // Checks-Effects-Interactions
        deposits[msg.sender] -= amount;
        totalDeposited -= amount;

        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ─── Öğrenci ─────────────────────────────────────────────────────────────

    /// @param amount Borç alınacak MON miktarı (wei)
    /// @param referrer Referans veren öğrenci cüzdanı (yoksa address(0))
    function borrow(uint256 amount, address referrer) external onlyStudent nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (borrowed[msg.sender] != 0) revert AlreadyHasLoan();

        // Yeni öğrenciye baz limit ata
        if (creditLimit[msg.sender] == 0) {
            creditLimit[msg.sender] = BASE_CREDIT;
        }

        // Referral bonusu (ilk borrow'da geçerli)
        if (
            referrer != address(0) &&
            referrer != msg.sender &&
            studentID.isRegistered(referrer) &&
            !referralClaimed[referrer]
        ) {
            referralClaimed[referrer] = true;
            creditLimit[msg.sender] += REFERRAL_BONUS;
            // Referrer henüz borrow yapmamışsa BASE_CREDIT ile başlat
            if (creditLimit[referrer] == 0) creditLimit[referrer] = BASE_CREDIT;
            creditLimit[referrer] += REFERRAL_BONUS;
            emit ReferralBonusGranted(referrer, msg.sender, REFERRAL_BONUS);
        }

        if (amount > creditLimit[msg.sender]) revert ExceedsCreditLimit();
        if (amount > availableLiquidity()) revert InsufficientLiquidity();

        // Effects
        borrowed[msg.sender] = amount;
        borrowedAt[msg.sender] = block.timestamp;
        totalBorrowed += amount;

        // Interaction
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        emit Borrowed(msg.sender, amount, creditLimit[msg.sender]);
    }

    /// @notice Borcu faizle birlikte geri öde. Fazla gönderilen MON iade edilir.
    function repay() external payable onlyStudent nonReentrant {
        if (borrowed[msg.sender] == 0) revert NoActiveLoan();

        uint256 debt = currentDebt(msg.sender);
        uint256 principal = borrowed[msg.sender];
        uint256 interest = debt - principal;

        uint256 refund = msg.value > debt ? msg.value - debt : 0;

        // Effects
        borrowed[msg.sender] = 0;
        borrowedAt[msg.sender] = 0;
        totalBorrowed -= principal;
        totalDeposited += interest; // faiz havuza eklenir

        repayCount[msg.sender]++;
        creditLimit[msg.sender] += LIMIT_INCREMENT;

        emit Repaid(msg.sender, principal, interest);
        emit CreditLimitUpdated(msg.sender, creditLimit[msg.sender]);

        // Fazla iade
        if (refund > 0) {
            (bool ok,) = msg.sender.call{value: refund}("");
            require(ok, "refund failed");
        }
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    /// @notice Temerrüt eden öğrencinin limitini sıfırla ve kimliğini iptal et
    function markDefault(address student) external onlyOwner {
        if (borrowed[student] == 0) revert NoActiveLoan();
        require(block.timestamp - borrowedAt[student] > MAX_BORROW_DURATION, "not overdue");

        uint256 debt = currentDebt(student);
        emit DefaultMarked(student, debt);

        creditLimit[student] = 0;
        studentID.revoke(student);
    }

    function setParameters(
        uint256 baseCredit,
        uint256 limitIncrement,
        uint256 referralBonus,
        uint256 annualRateBps,
        uint256 maxBorrowDuration
    ) external onlyOwner {
        BASE_CREDIT = baseCredit;
        LIMIT_INCREMENT = limitIncrement;
        REFERRAL_BONUS = referralBonus;
        ANNUAL_RATE_BPS = annualRateBps;
        MAX_BORROW_DURATION = maxBorrowDuration;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Anapara + lineer faiz
    function currentDebt(address user) public view returns (uint256) {
        uint256 principal = borrowed[user];
        if (principal == 0) return 0;
        uint256 elapsed = block.timestamp - borrowedAt[user];
        uint256 interest = (principal * ANNUAL_RATE_BPS * elapsed) / (10_000 * 365 days);
        return principal + interest;
    }

    function availableLiquidity() public view returns (uint256) {
        return totalDeposited - totalBorrowed;
    }

    receive() external payable {}
}
