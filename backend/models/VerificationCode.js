const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema({
  // Kucuk harfe normalize edilmis e-posta.
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // 6 haneli sayisal dogrulama kodu.
  code: {
    type: String,
    required: true,
  },

  // Kodu talep eden cuzdan (kucuk harf).
  address: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // Talep sirasinda iletilen referral kodu (varsa).
  referralCode: {
    type: String,
    default: null,
  },

  // Kodun gecerlilik bitis zamani. TTL index ile suresi dolan belgeler silinir.
  expiresAt: {
    type: Date,
    required: true,
  },

  used: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: expiresAt gecince belge otomatik silinir.
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Rate-limit ve dogrulama sorgulari icin yardimci index.
verificationCodeSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("VerificationCode", verificationCodeSchema);
