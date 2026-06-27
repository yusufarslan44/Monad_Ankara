/**
 * aiCreditService — kredi-skoru ozelliklerini Gemini ile yorumlayip
 * yapilandirilmis bir sonuc uretir. GEMINI_API_KEY yoksa veya cagri/parse
 * basarisizsa deterministik fallback skoruna duser (giris/dashboard kirilmaz).
 */

const RISK_BANDS = ["dusuk", "orta", "yuksek"];
const TRENDS = ["Yukseliyor", "Dengeli", "Baski Altinda"];

const SYSTEM_INSTRUCTION = `Sen bir kampus nano-kredi protokolu icin kredi risk analistisin.
Sana bir ogrenci cuzdaninin on-chain odeme verileri verilir. Gorevin 0-100 arasi bir kredi
puani uretmek ve kisa, anlasilir bir Turkce degerlendirme yapmaktir.

Rubric:
- Zamaninda ve duzenli geri odeme (repayCount, onTimeRepayCount yuksek) puani YUKSELTIR.
- Gecikmis aktif borc (overdue=true) ve temerrut (defaultCount>0) puani CIDDI dusurur.
- Yuksek kullanim orani (utilizationPct > 0.8) riski artirir, puani dusurur.
- Hesap yasi ve havuza yatirim (depositsMON) olumlu sinyaldir.
- Hic gecmisi olmayan yeni kullanici ~50 civari notr bir puanla baslar.
Skoru daima 0-100 araliginda tut. Ozet ve oneriler Turkce olsun, kisa ve somut.`;

let _ai = null;

function getAI() {
  if (_ai) return _ai;
  // Lazy require: paket yoksa fallback yolu yine calisir.
  const { GoogleGenAI } = require("@google/genai");
  _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

function clampScore(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 50;
  return Math.max(0, Math.min(100, x));
}

function bandFor(score) {
  if (score >= 70) return "dusuk";
  if (score >= 45) return "orta";
  return "yuksek";
}

/** Gemini yoksa/hata verirse: ozelliklerden deterministik skor uretir. */
function fallbackScore(features = {}) {
  let score = 50 + (Number(features.repayCount) || 0) * 10;
  if (!features.hasActiveLoan) score += 5;
  if (features.overdue) score -= 25;
  if (features.defaultCount) score -= 20 * Number(features.defaultCount);
  if (features.lateRepayCount) score -= 5 * Number(features.lateRepayCount);
  if (Number(features.utilizationPct) > 0.8) score -= 10;
  score = clampScore(score);

  let trend = "Dengeli";
  if (features.overdue || features.defaultCount) trend = "Baski Altinda";
  else if ((Number(features.repayCount) || 0) >= 2) trend = "Yukseliyor";

  const factors = [];
  if (features.repayCount) factors.push(`${features.repayCount} basarili geri odeme`);
  if (features.overdue) factors.push("Vadesi gecmis aktif borc");
  if (features.defaultCount) factors.push(`${features.defaultCount} temerrut kaydi`);
  if (Number(features.utilizationPct) > 0.8) factors.push("Yuksek kredi kullanim orani");
  if (!features.hasActiveLoan) factors.push("Acik borc yok");

  return {
    score,
    riskBand: bandFor(score),
    trend,
    factors,
    recommendations: features.hasActiveLoan
      ? ["Borcunu zamaninda ve duzenli ode; gecikme itibarini dusurur."]
      : ["Kucuk bir kredi alip zamaninda odeyerek itibar gecmisi olustur."],
    summary: "On-chain veriden deterministik (AI'siz) hesaplanan skor.",
    source: "fallback",
  };
}

function buildResponseSchema(Type) {
  return {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      riskBand: { type: Type.STRING, enum: RISK_BANDS },
      trend: { type: Type.STRING, enum: TRENDS },
      factors: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      summary: { type: Type.STRING },
    },
    required: ["score", "riskBand", "trend", "factors", "recommendations", "summary"],
  };
}

/**
 * Ozellikleri AI ile skora cevirir.
 * @param {object} features creditFeatures.gatherFeatures ciktisi
 * @returns {Promise<object>} { score, riskBand, trend, factors, recommendations, summary, source }
 */
async function scoreUser(features) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackScore(features);
  }

  try {
    const { Type } = require("@google/genai");
    const ai = getAI();

    const prompt =
      "Asagidaki on-chain kredi verisini degerlendir ve JSON sema formatinda yanit ver:\n\n" +
      JSON.stringify(features, null, 2);

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(Type),
        temperature: 0.2,
      },
    });

    const text = typeof response.text === "function" ? response.text() : response.text;
    const parsed = JSON.parse(text);

    const score = clampScore(parsed.score);
    const riskBand = RISK_BANDS.includes(parsed.riskBand) ? parsed.riskBand : bandFor(score);
    const trend = TRENDS.includes(parsed.trend) ? parsed.trend : "Dengeli";

    return {
      score,
      riskBand,
      trend,
      factors: Array.isArray(parsed.factors) ? parsed.factors.map(String) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String)
        : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      source: "gemini",
    };
  } catch (err) {
    console.error("Gemini skorlama hatasi, fallback kullaniliyor:", err.message);
    return fallbackScore(features);
  }
}

module.exports = { scoreUser, fallbackScore };
