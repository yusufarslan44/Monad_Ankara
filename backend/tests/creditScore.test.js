// ─── Mock'lar (gercek Gemini/RPC yok) ───────────────────────────────────────

// @google/genai: kontrol edilebilir sahte generateContent.
const mockGenerateContent = jest.fn();
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: { OBJECT: "OBJECT", STRING: "STRING", NUMBER: "NUMBER", ARRAY: "ARRAY" },
}));

// creditFeatures: sabit ozellik nesnesi (zincire gitmez).
jest.mock("../services/creditFeatures", () => ({
  gatherFeatures: jest.fn(),
}));

// chainService: dashboard testinde RPC'ye gitmesin.
jest.mock("../services/chainService", () => ({
  isRegistered: jest.fn().mockResolvedValue(false),
  registerStudent: jest.fn(),
}));

const request = require("supertest");
const app = require("../server");
const { connect, clearDatabase, closeDatabase } = require("./setup");
const User = require("../models/User");
const CreditScore = require("../models/CreditScore");
const { emailHash } = require("../utils/hash");
const { gatherFeatures } = require("../services/creditFeatures");
const aiCreditService = require("../services/aiCreditService");
const worker = require("../services/creditScoreWorker");
const { getDashboardSnapshot } = require("../services/chainDataService");

const ADDRESS = "0x1111111111111111111111111111111111111111";
const ADDRESS_2 = "0x2222222222222222222222222222222222222222";

const FEATURES = {
  address: ADDRESS,
  accountAgeDays: 30,
  repayCount: 3,
  hasActiveLoan: false,
  principalMON: 0,
  currentDebtMON: 0,
  accruedInterestMON: 0,
  creditLimitMON: 0.03,
  depositsMON: 0.1,
  utilizationPct: 0,
  daysSinceBorrow: 0,
  overdue: false,
  maxBorrowDurationDays: 30,
  annualRateBps: 500,
  totalBorrows: 3,
  totalRepays: 3,
  defaultCount: 0,
  onTimeRepayCount: 3,
  lateRepayCount: 0,
  historyAvailable: true,
};

const VALID_AI_JSON = {
  score: 88,
  riskBand: "dusuk",
  trend: "Yukseliyor",
  factors: ["3 zamaninda geri odeme"],
  recommendations: ["Duzenli odemeye devam et"],
  summary: "Saglikli odeme gecmisi.",
};

async function createUser(address) {
  return User.create({
    address,
    emailHash: emailHash(`${address}@odtu.edu.tr`),
    verified: true,
  });
}

beforeAll(connect);
afterAll(closeDatabase);

beforeEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
  gatherFeatures.mockResolvedValue(FEATURES);
  mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_AI_JSON) });
});

// ─── aiCreditService ─────────────────────────────────────────────────────────

describe("aiCreditService.scoreUser", () => {
  test("GEMINI_API_KEY yoksa fallback skoru doner", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await aiCreditService.scoreUser(FEATURES);
    expect(result.source).toBe("fallback");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(["Yukseliyor", "Dengeli", "Baski Altinda"]).toContain(result.trend);
  });

  test("Gemini basarili yanitta source=gemini ve skor parse edilir", async () => {
    const result = await aiCreditService.scoreUser(FEATURES);
    expect(result.source).toBe("gemini");
    expect(result.score).toBe(88);
    expect(result.riskBand).toBe("dusuk");
    expect(result.trend).toBe("Yukseliyor");
  });

  test("Skoru 0-100 araligina clamp eder", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ ...VALID_AI_JSON, score: 250 }),
    });
    const result = await aiCreditService.scoreUser(FEATURES);
    expect(result.score).toBe(100);
  });

  test("Gemini hata atarsa fallback'e duser", async () => {
    mockGenerateContent.mockRejectedValue(new Error("kota asildi"));
    const result = await aiCreditService.scoreUser(FEATURES);
    expect(result.source).toBe("fallback");
  });
});

// ─── worker ──────────────────────────────────────────────────────────────────

describe("creditScoreWorker.runOnce", () => {
  test("kayitli kullanicilar icin CreditScore yazar", async () => {
    await createUser(ADDRESS);
    await createUser(ADDRESS_2);

    const summary = await worker.runOnce({ force: true });

    expect(summary.scored).toBe(2);
    expect(await CreditScore.countDocuments()).toBe(2);

    const doc = await CreditScore.findOne({ address: ADDRESS });
    expect(doc.score).toBe(88);
    expect(doc.source).toBe("gemini");
    expect(doc.features.repayCount).toBe(3);
  });
});

// ─── uclar ───────────────────────────────────────────────────────────────────

describe("GET /api/credit-score", () => {
  test("cache yoksa on-demand hesaplar ve doner", async () => {
    const res = await request(app).get("/api/credit-score").query({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(88);
    expect(res.body.data.source).toBe("gemini");
    expect(await CreditScore.countDocuments({ address: ADDRESS })).toBe(1);
  });

  test("cache varsa onu doner (yeniden hesaplamaz)", async () => {
    await CreditScore.create({
      address: ADDRESS,
      score: 42,
      riskBand: "yuksek",
      trend: "Baski Altinda",
      summary: "cache",
      source: "fallback",
    });

    const res = await request(app).get("/api/credit-score").query({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(42);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  test("gecersiz adres -> 400", async () => {
    const res = await request(app).get("/api/credit-score").query({ address: "0xabc" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Gecersiz cuzdan adresi");
  });
});

describe("POST /api/credit-score/refresh", () => {
  test("skoru zorla yeniden hesaplar ve upsert eder", async () => {
    await CreditScore.create({
      address: ADDRESS,
      score: 10,
      riskBand: "yuksek",
      trend: "Baski Altinda",
      summary: "eski",
      source: "fallback",
    });

    const res = await request(app)
      .post("/api/credit-score/refresh")
      .send({ address: ADDRESS });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(88);
    expect(res.body.data.source).toBe("gemini");

    const doc = await CreditScore.findOne({ address: ADDRESS });
    expect(doc.score).toBe(88);
  });

  test("adres yoksa -> 400", async () => {
    const res = await request(app).post("/api/credit-score/refresh").send({});
    expect(res.status).toBe(400);
  });
});

// ─── dashboard entegrasyonu ──────────────────────────────────────────────────

describe("getDashboardSnapshot AI reputation entegrasyonu", () => {
  const originalRpc = process.env.MONAD_RPC_URL;

  beforeAll(() => {
    // Zincir okumasi hizlica fail etsin -> fallback snapshot yolu.
    process.env.MONAD_RPC_URL = "http://127.0.0.1:1";
  });
  afterAll(() => {
    process.env.MONAD_RPC_URL = originalRpc;
  });

  test("CreditScore varsa reputation AI degerlerini yansitir", async () => {
    await createUser(ADDRESS);
    await CreditScore.create({
      address: ADDRESS,
      score: 77,
      riskBand: "orta",
      trend: "Baski Altinda",
      summary: "AI ozeti",
      source: "gemini",
    });

    const snapshot = await getDashboardSnapshot(ADDRESS);

    expect(snapshot).not.toBeNull();
    expect(snapshot.reputation.score).toBe(77);
    expect(snapshot.reputation.trend).toBe("Baski Altinda");
    expect(snapshot.reputation.summary).toBe("AI ozeti");
  });
});
