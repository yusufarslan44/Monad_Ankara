const crypto = require("crypto");
const { ethers } = require("ethers");
const User = require("../models/User");
const VerificationCode = require("../models/VerificationCode");
const chainService = require("../services/chainService");
const emailService = require("../services/emailService");
const { emailHash } = require("../utils/hash");

// Yalnizca .edu.tr e-postalari kabul edilir.
const EDU_TR_REGEX = /^[^\s@]+@[^\s@]+\.edu\.tr$/i;

const CODE_TTL_MS = 15 * 60 * 1000; // 15 dakika
const RATE_LIMIT_MS = 60 * 1000; // 60 saniye

/**
 * POST /api/auth/request-code
 * Cuzdan + e-posta alir, .edu.tr dogrular, 6 haneli kod uretip e-posta ile gonderir.
 */
async function requestCode(req, res, next) {
  try {
    const { address, email, referralCode } = req.body || {};

    if (!address || !email) {
      return res
        .status(400)
        .json({ success: false, error: "address ve email zorunludur" });
    }

    if (!ethers.isAddress(address)) {
      return res
        .status(400)
        .json({ success: false, error: "Gecersiz cuzdan adresi" });
    }

    const normalizedAddress = String(address).toLowerCase().trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    // 1) E-posta format kontrolu
    if (!EDU_TR_REGEX.test(normalizedEmail)) {
      return res
        .status(400)
        .json({ success: false, error: "Sadece .edu.tr e-postalar kabul edilir" });
    }

    // 2) Rate limit: son 60 saniyede ayni e-postaya kod gonderildi mi?
    const recent = await VerificationCode.findOne({
      email: normalizedEmail,
      createdAt: { $gt: new Date(Date.now() - RATE_LIMIT_MS) },
    });
    if (recent) {
      return res.status(429).json({ success: false, error: "Lutfen 1 dakika bekleyin" });
    }

    // 3) Sybil: bu e-posta zaten dogrulanmis mi?
    const hash = emailHash(normalizedEmail);
    const existing = await User.findOne({ emailHash: hash, verified: true });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Bu e-posta zaten dogrulanmis" });
    }

    // 4) 6 haneli kod uret
    const code = String(crypto.randomInt(100000, 1000000));

    // 5) Kaydet (15 dk TTL)
    await VerificationCode.create({
      email: normalizedEmail,
      code,
      address: normalizedAddress,
      referralCode: referralCode || null,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    // 6) E-posta gonder
    await emailService.sendVerificationCode(normalizedEmail, code);

    return res.status(200).json({ success: true, message: "Kod gonderildi" });
  } catch (err) {
    console.error("requestCode hatasi:", err);
    return next(err);
  }
}

/**
 * POST /api/auth/verify-code
 * Kodu dogrular, kullaniciyi olusturur/gunceller ve zincirde StudentID.register cagirir.
 */
async function verifyCode(req, res, next) {
  try {
    const { email, code, address } = req.body || {};

    if (!email || !code || !address) {
      return res
        .status(400)
        .json({ success: false, error: "email, code ve address zorunludur" });
    }

    if (!ethers.isAddress(address)) {
      return res
        .status(400)
        .json({ success: false, error: "Gecersiz cuzdan adresi" });
    }

    const normalizedAddress = String(address).toLowerCase().trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    // 1) Gecerli, kullanilmamis ve suresi dolmamis kodu bul
    const verification = await VerificationCode.findOne({
      email: normalizedEmail,
      code: String(code),
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!verification) {
      return res
        .status(400)
        .json({ success: false, error: "Gecersiz veya suresi dolmus kod" });
    }

    // 2) Cuzdan eslesme kontrolu
    if (verification.address !== normalizedAddress) {
      return res
        .status(400)
        .json({ success: false, error: "Kod farkli cuzdan icin alinmis" });
    }

    // 3) Sybil kontrolu
    const hash = emailHash(normalizedEmail);
    const alreadyVerified = await User.findOne({ emailHash: hash, verified: true });
    if (alreadyVerified) {
      return res
        .status(400)
        .json({ success: false, error: "Bu e-posta zaten dogrulanmis" });
    }

    // 4) Referral cozumu (davet eden adres) — frontend borrow(amount, referrer) icin kullanir
    let inviterAddress = null;
    if (verification.referralCode) {
      const inviter = await User.findOne({ referralCode: verification.referralCode });
      if (inviter) inviterAddress = inviter.address;
    }

    // 5) Kullaniciyi olustur veya mevcut cuzdan kaydini guncelle
    const user = await User.findOneAndUpdate(
      { address: normalizedAddress },
      {
        $set: {
          emailHash: hash,
          emailDomain: normalizedEmail.split("@")[1],
          inviterAddress,
          verified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6) Zincir uzerinde StudentID.register — dayanikli: hata olursa giris dusmez
    let registered = false;
    let txHash = null;
    try {
      const result = await chainService.registerStudent(normalizedAddress);
      registered = true;
      txHash = result.txHash;
      user.registered = true;
      user.registrationTxHash = txHash;
      await user.save();
    } catch (chainErr) {
      console.error("Zincir register hatasi (giris devam ediyor):", chainErr.message);
    }

    // 7) Kodu kullanildi olarak isaretle
    verification.used = true;
    await verification.save();

    return res.status(200).json({
      success: true,
      registered,
      txHash,
      referral: inviterAddress ? { inviterAddress } : null,
    });
  } catch (err) {
    console.error("verifyCode hatasi:", err);
    return next(err);
  }
}

module.exports = { requestCode, verifyCode };
