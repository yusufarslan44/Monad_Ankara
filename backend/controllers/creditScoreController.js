const { ethers } = require("ethers");
const CreditScore = require("../models/CreditScore");
const { scoreAndPersist } = require("../services/creditScoreWorker");

/** CreditScore belgesini API yanit formatina cevirir. */
function format(doc) {
  return {
    address: doc.address,
    score: doc.score,
    riskBand: doc.riskBand,
    trend: doc.trend,
    factors: doc.factors,
    recommendations: doc.recommendations,
    summary: doc.summary,
    source: doc.source,
    updatedAt: doc.updatedAt,
  };
}

function normalize(address) {
  if (!address) return { error: "address zorunludur" };
  if (!ethers.isAddress(address)) return { error: "Gecersiz cuzdan adresi" };
  return { value: String(address).toLowerCase().trim() };
}

/**
 * GET /api/credit-score?address=0x...
 * Cache'li skoru doner; yoksa on-demand hesaplayip cache'ler.
 */
async function getScore(req, res, next) {
  try {
    const { value, error } = normalize(req.query.address);
    if (error) return res.status(400).json({ success: false, error });

    const existing = await CreditScore.findOne({ address: value });
    if (existing) {
      return res.status(200).json({ success: true, data: format(existing) });
    }

    // Cache yok -> on-demand hesapla (Gemini yoksa fallback uretir).
    const doc = await scoreAndPersist(value);
    return res.status(200).json({ success: true, data: format(doc) });
  } catch (err) {
    console.error("getScore hatasi:", err.message);
    return next(err);
  }
}

/**
 * POST /api/credit-score/refresh  body: { address }
 * Skoru zorla yeniden hesaplar ve cache'i gunceller.
 */
async function refreshScore(req, res, next) {
  try {
    const { value, error } = normalize(req.body ? req.body.address : null);
    if (error) return res.status(400).json({ success: false, error });

    const doc = await scoreAndPersist(value);
    return res.status(200).json({ success: true, data: format(doc) });
  } catch (err) {
    console.error("refreshScore hatasi:", err.message);
    return next(err);
  }
}

module.exports = { getScore, refreshScore };
