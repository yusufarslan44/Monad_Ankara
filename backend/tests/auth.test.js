// Zincir ve e-posta servislerini mock'la (gercek RPC/SMTP yok).
jest.mock("../services/chainService", () => ({
  registerStudent: jest.fn().mockResolvedValue({ txHash: "0xtxhash", alreadyRegistered: false }),
  isRegistered: jest.fn().mockResolvedValue(false),
}));
jest.mock("../services/emailService", () => ({
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const app = require("../server");
const { connect, clearDatabase, closeDatabase } = require("./setup");
const User = require("../models/User");
const VerificationCode = require("../models/VerificationCode");
const chainService = require("../services/chainService");
const emailService = require("../services/emailService");
const { emailHash } = require("../utils/hash");

const ADDRESS = "0x1111111111111111111111111111111111111111";
const ADDRESS_2 = "0x2222222222222222222222222222222222222222";
const EDU_EMAIL = "ogrenci@bogazici.edu.tr";

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(closeDatabase);

// Verilen e-posta icin DB'deki dogrulama kodunu dondurur.
async function getStoredCode(email) {
  const vc = await VerificationCode.findOne({ email: email.toLowerCase() });
  return vc ? vc.code : null;
}

describe("POST /api/auth/request-code", () => {
  test("gecerli .edu.tr e-posta -> 200 ve kod uretilir", async () => {
    const res = await request(app)
      .post("/api/auth/request-code")
      .send({ address: ADDRESS, email: EDU_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Kod gonderildi" });

    const vc = await VerificationCode.findOne({ email: EDU_EMAIL });
    expect(vc).not.toBeNull();
    expect(vc.code).toMatch(/^\d{6}$/);
    expect(emailService.sendVerificationCode).toHaveBeenCalledTimes(1);
  });

  test(".edu.tr olmayan e-posta -> 400", async () => {
    const res = await request(app)
      .post("/api/auth/request-code")
      .send({ address: ADDRESS, email: "ogrenci@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Sadece .edu.tr e-postalar kabul edilir");
  });

  test("60 saniye icinde ikinci istek -> 429", async () => {
    await request(app).post("/api/auth/request-code").send({ address: ADDRESS, email: EDU_EMAIL });
    const res = await request(app)
      .post("/api/auth/request-code")
      .send({ address: ADDRESS, email: EDU_EMAIL });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe("Lutfen 1 dakika bekleyin");
  });

  test("zaten dogrulanmis e-posta -> 400", async () => {
    await User.create({
      address: ADDRESS_2,
      emailHash: emailHash(EDU_EMAIL),
      verified: true,
    });

    const res = await request(app)
      .post("/api/auth/request-code")
      .send({ address: ADDRESS, email: EDU_EMAIL });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bu e-posta zaten dogrulanmis");
  });
});

describe("POST /api/auth/verify-code", () => {
  test("gecerli kod -> 200, kullanici olusur ve zincire kaydedilir", async () => {
    await request(app).post("/api/auth/request-code").send({ address: ADDRESS, email: EDU_EMAIL });
    const code = await getStoredCode(EDU_EMAIL);

    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ address: ADDRESS, email: EDU_EMAIL, code });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.registered).toBe(true);
    expect(res.body.txHash).toBe("0xtxhash");
    expect(res.body.referral).toBeNull();
    expect(chainService.registerStudent).toHaveBeenCalledWith(ADDRESS);

    const user = await User.findOne({ address: ADDRESS });
    expect(user).not.toBeNull();
    expect(user.verified).toBe(true);
    expect(user.registered).toBe(true);
    expect(user.emailDomain).toBe("bogazici.edu.tr");

    const vc = await VerificationCode.findOne({ email: EDU_EMAIL });
    expect(vc.used).toBe(true);
  });

  test("gecersiz kod -> 400", async () => {
    await request(app).post("/api/auth/request-code").send({ address: ADDRESS, email: EDU_EMAIL });

    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ address: ADDRESS, email: EDU_EMAIL, code: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Gecersiz veya suresi dolmus kod");
  });

  test("kod farkli cuzdan icin alinmis -> 400", async () => {
    await request(app).post("/api/auth/request-code").send({ address: ADDRESS, email: EDU_EMAIL });
    const code = await getStoredCode(EDU_EMAIL);

    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ address: ADDRESS_2, email: EDU_EMAIL, code });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Kod farkli cuzdan icin alinmis");
  });

  test("Sybil: e-posta zaten dogrulanmis -> 400", async () => {
    // Kodu dogrudan olustur, sonra ayni emailHash ile dogrulanmis kullanici ekle.
    await VerificationCode.create({
      email: EDU_EMAIL,
      code: "123456",
      address: ADDRESS,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await User.create({
      address: ADDRESS_2,
      emailHash: emailHash(EDU_EMAIL),
      verified: true,
    });

    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ address: ADDRESS, email: EDU_EMAIL, code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bu e-posta zaten dogrulanmis");
  });

  test("referral kodu ile -> davet eden adres cozumlenir", async () => {
    // Davet eden kullanici ve kodu.
    const inviter = await User.create({
      address: ADDRESS_2,
      emailHash: emailHash("davetci@odtu.edu.tr"),
      verified: true,
      referralCode: "MON-ABC123",
    });

    await request(app)
      .post("/api/auth/request-code")
      .send({ address: ADDRESS, email: EDU_EMAIL, referralCode: "MON-ABC123" });
    const code = await getStoredCode(EDU_EMAIL);

    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ address: ADDRESS, email: EDU_EMAIL, code });

    expect(res.status).toBe(200);
    expect(res.body.referral).toEqual({ inviterAddress: inviter.address });

    const user = await User.findOne({ address: ADDRESS });
    expect(user.inviterAddress).toBe(inviter.address);
  });
});
