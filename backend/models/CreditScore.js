const mongoose = require("mongoose");

/**
 * CreditScore — adres basina son AI kredi-skoru (upsert ile guncellenir).
 * Worker periyodik olarak veya on-demand uclar tarafindan yazilir.
 */
const creditScoreSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // 0-100 arasi kredi puani.
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  // Risk bandi: dusuk / orta / yuksek.
  riskBand: {
    type: String,
    enum: ["dusuk", "orta", "yuksek"],
    default: "orta",
  },

  // Frontend ReputationSnapshot.trend ile birebir uyumlu.
  trend: {
    type: String,
    enum: ["Yukseliyor", "Dengeli", "Baski Altinda"],
    default: "Dengeli",
  },

  // Skoru etkileyen sinyaller.
  factors: {
    type: [String],
    default: [],
  },

  // Kullaniciya oneriler.
  recommendations: {
    type: [String],
    default: [],
  },

  // Kisa Turkce ozet.
  summary: {
    type: String,
    default: "",
  },

  // Skorun kaynagi: gemini (AI) veya fallback (deterministik).
  source: {
    type: String,
    enum: ["gemini", "fallback"],
    default: "fallback",
  },

  // Skorlamada kullanilan ozellik anlik goruntusu (denetim/seffaflik).
  features: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CreditScore", creditScoreSchema);
