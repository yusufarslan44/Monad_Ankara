const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Cuzdan adresi — her zaman kucuk harf (controller'da .toLowerCase()).
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // E-posta keccak256 hash'i — 0x ile baslayan 66 karakter.
  emailHash: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[0-9a-fA-F]{64}$/,
  },

  // E-postanin domain kismi (ornek: bogazici.edu.tr).
  emailDomain: {
    type: String,
    default: null,
  },

  verified: {
    type: Boolean,
    default: false,
  },

  // Cuzdan kaybinda eski adresler burada saklanir.
  previousAddresses: {
    type: [String],
    default: [],
  },

  // Kullaniciya ait referral kodu (MON-XXXXXX). Bos olabilir.
  // Benzersizlik asagida partial index ile yalnizca string degerlerde uygulanir
  // (default null oldugu icin sparse yetmez; cok sayida null carpisirdi).
  referralCode: {
    type: String,
    default: null,
  },

  // Bu kullaniciyi davet eden cuzdan (kucuk harf).
  inviterAddress: {
    type: String,
    lowercase: true,
    default: null,
  },

  // Zincir uzerinde StudentID kaydi yapildi mi?
  registered: {
    type: Boolean,
    default: false,
  },

  // register() islem hash'i (varsa).
  registrationTxHash: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// referralCode benzersizligi yalnizca gercek (string) kodlarda gecerli — null'lar haric.
userSchema.index(
  { referralCode: 1 },
  { unique: true, partialFilterExpression: { referralCode: { $type: "string" } } }
);

module.exports = mongoose.model("User", userSchema);
