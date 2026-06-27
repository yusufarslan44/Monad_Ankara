const crypto = require("crypto");
const request = require("supertest");
const app = require("../server");
const { connect, clearDatabase, closeDatabase } = require("./setup");
const User = require("../models/User");
const { emailHash } = require("../utils/hash");

const ADDRESS = "0x1111111111111111111111111111111111111111";
const ADDRESS_2 = "0x2222222222222222222222222222222222222222";

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.restoreAllMocks();
});
afterAll(closeDatabase);

async function createUser(address, extra = {}) {
  return User.create({
    address,
    emailHash: emailHash(`${address}@odtu.edu.tr`),
    verified: true,
    ...extra,
  });
}

describe("GET /api/referral/generate", () => {
  test("kodu olmayan kullaniciya yeni kod uretir", async () => {
    await createUser(ADDRESS);

    const res = await request(app).get("/api/referral/generate").query({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toMatch(/^MON-[0-9A-F]{6}$/);

    const user = await User.findOne({ address: ADDRESS });
    expect(user.referralCode).toBe(res.body.code);
  });

  test("mevcut kodu olan kullaniciya ayni kodu dondurur", async () => {
    await createUser(ADDRESS, { referralCode: "MON-AAAAAA" });

    const res = await request(app).get("/api/referral/generate").query({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("MON-AAAAAA");
  });

  test("bilinmeyen adres -> 404", async () => {
    const res = await request(app).get("/api/referral/generate").query({ address: ADDRESS });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Kullanici bulunamadi");
  });

  test("kod cakismasinda benzersiz uretene kadar tekrar dener", async () => {
    // Cakisacak kod onceden bir kullaniciya atanmis olsun.
    await createUser(ADDRESS_2, { referralCode: "MON-AAAAAA" });
    await createUser(ADDRESS);

    // Ilk uretim cakisan kodu (AAAAAA), ikincisi benzersiz kodu (BBBBBB) dondursun.
    jest
      .spyOn(crypto, "randomBytes")
      .mockReturnValueOnce(Buffer.from([0xaa, 0xaa, 0xaa]))
      .mockReturnValueOnce(Buffer.from([0xbb, 0xbb, 0xbb]));

    const res = await request(app).get("/api/referral/generate").query({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("MON-BBBBBB");
  });
});

describe("GET /api/referral/resolve", () => {
  test("gecerli kod -> davet eden adres", async () => {
    await createUser(ADDRESS, { referralCode: "MON-ABCDEF" });

    const res = await request(app).get("/api/referral/resolve").query({ code: "MON-ABCDEF" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, inviterAddress: ADDRESS });
  });

  test("bilinmeyen kod -> 404", async () => {
    const res = await request(app).get("/api/referral/resolve").query({ code: "MON-ZZZZZZ" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Referral kodu bulunamadi");
  });
});
