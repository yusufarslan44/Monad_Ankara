/**
 * Backend <-> Akilli Kontrat Uyum/Entegrasyon Testi
 *
 * 1) Statik uyum: backend chainService'in kullandigi fonksiyon imzalari/selector'lari
 *    gercek contract/src/StudentID.sol ile birebir mi?
 * 2) Canli entegrasyon: gercek StudentID ile AYNI arayuze sahip bir kontrat yerel bir
 *    EVM'e (ganache) deploy edilir; gercek chainService.registerStudent / isRegistered
 *    akisi uctan uca calistirilir (admin gating dahil).
 *
 * Not: Gercek kontratlar henuz canliya alinmadigi (deployment adresleri placeholder)
 * ve ortamda Foundry/OZ olmadigi icin, gercek StudentID.sol ile AYNI external arayuze
 * sahip bir kontrat kullanilir. Arayuzun gercek kontratla esitligi (1) ile dogrulanir.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const solc = require("solc");
const ganache = require("ganache");
const chainService = require("../services/chainService");

const PORT = 8632;
const RPC_URL = `http://127.0.0.1:${PORT}`;

// Gercek StudentID.sol ile ayni external arayuz + admin gating mantigi.
const MOCK_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StudentIDMock {
    error NotAdmin();
    error AlreadyRegistered();
    error NotRegistered();

    event Registered(address indexed student, uint256 tokenId);
    event Revoked(address indexed student, uint256 tokenId);

    mapping(address => bool) public isAdmin;
    mapping(address => uint256) public studentTokenId;
    uint256 private _nextTokenId = 1;

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert NotAdmin();
        _;
    }

    constructor(address admin) {
        isAdmin[admin] = true;
    }

    function register(address student) public onlyAdmin {
        if (isRegistered(student)) revert AlreadyRegistered();
        uint256 tokenId = _nextTokenId++;
        studentTokenId[student] = tokenId;
        emit Registered(student, tokenId);
    }

    function revoke(address student) public onlyAdmin {
        if (!isRegistered(student)) revert NotRegistered();
        uint256 tokenId = studentTokenId[student];
        studentTokenId[student] = 0;
        emit Revoked(student, tokenId);
    }

    function isRegistered(address student) public view returns (bool) {
        return studentTokenId[student] != 0;
    }
}
`;

function compileMock() {
  const input = {
    language: "Solidity",
    sources: { "StudentIDMock.sol": { content: MOCK_SOURCE } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length) {
    throw new Error("solc derleme hatasi: " + errors.map((e) => e.formattedMessage).join("\n"));
  }
  const c = output.contracts["StudentIDMock.sol"].StudentIDMock;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

describe("1) Statik ABI/selector uyumu (backend ABI vs StudentID.sol)", () => {
  const studentIdSource = fs.readFileSync(
    path.join(__dirname, "../../contract/src/StudentID.sol"),
    "utf8"
  );

  test("backend ABI'sindeki selector'lar dogru canonical imzalari uretir", () => {
    const iface = new ethers.Interface(chainService.STUDENT_ID_ABI);
    const expected = {
      register: "register(address)",
      isRegistered: "isRegistered(address)",
      revoke: "revoke(address)",
    };
    for (const [name, sig] of Object.entries(expected)) {
      const fn = iface.getFunction(name);
      expect(fn.format("sighash")).toBe(sig);
      expect(fn.selector).toBe(ethers.id(sig).slice(0, 10));
    }
  });

  test("gercek StudentID.sol ayni fonksiyonlari ayni imzalarla sunuyor", () => {
    expect(studentIdSource).toMatch(/function\s+register\s*\(\s*address\s+student\s*\)\s+public\s+onlyAdmin/);
    expect(studentIdSource).toMatch(/function\s+revoke\s*\(\s*address\s+student\s*\)\s+public\s+onlyAdmin/);
    expect(studentIdSource).toMatch(/function\s+isRegistered\s*\(\s*address\s+student\s*\)\s+public\s+view\s+returns\s*\(\s*bool\s*\)/);
  });

  test("register admin yetkisi gerektiriyor (backend admin cuzdani sart)", () => {
    expect(studentIdSource).toMatch(/modifier\s+onlyAdmin/);
    expect(studentIdSource).toMatch(/constructor\s*\(\s*address\s+admin\s*\)/);
  });
});

describe("2) Canli entegrasyon (yerel EVM + gercek chainService)", () => {
  let server;
  let studentAddress;

  beforeAll(async () => {
    // Yerel EVM baslat
    server = ganache.server({ logging: { quiet: true } });
    await server.listen(PORT);

    // Admin hesabini al
    const accounts = await server.provider.getInitialAccounts();
    const adminAddr = Object.keys(accounts)[0];
    let adminKey = accounts[adminAddr].secretKey;
    if (!adminKey.startsWith("0x")) adminKey = "0x" + adminKey;

    // Bir ogrenci hesabi (ikinci hesap) — kayit edilecek adres
    studentAddress = Object.keys(accounts)[1];

    // chainService'in okuyacagi env'leri kur
    process.env.MONAD_RPC_URL = RPC_URL;
    process.env.ADMIN_PRIVATE_KEY = adminKey;

    // Kontrati admin cuzdaniyla deploy et (constructor admin = adminAddr)
    const { abi, bytecode } = compileMock();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(adminKey, provider);
    const factory = new ethers.ContractFactory(abi, bytecode, deployer);
    const contract = await factory.deploy(adminAddr);
    await contract.waitForDeployment();

    // chainService bu adresi kullansin
    process.env.STUDENT_ID_ADDRESS = await contract.getAddress();
  }, 60000);

  afterAll(async () => {
    if (server) await server.close();
  });

  test("isRegistered baslangicta false", async () => {
    expect(await chainService.isRegistered(studentAddress)).toBe(false);
  });

  test("registerStudent zincire kaydeder ve gecerli txHash doner", async () => {
    const result = await chainService.registerStudent(studentAddress);
    expect(result.alreadyRegistered).toBe(false);
    expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);

    expect(await chainService.isRegistered(studentAddress)).toBe(true);
  });

  test("zaten kayitli adres icin tekrar register zincire gitmez", async () => {
    const result = await chainService.registerStudent(studentAddress);
    expect(result.alreadyRegistered).toBe(true);
    expect(result.txHash).toBeNull();
  });
});
