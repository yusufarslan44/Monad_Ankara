const crypto = require("crypto");
const User = require("../models/User");

const MAX_ATTEMPTS = 10;

/** Benzersiz "MON-XXXXXX" formatinda referral kodu uretir (cakisma kontrollu). */
async function generateUniqueCode() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = "MON-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const clash = await User.findOne({ referralCode: candidate });
    if (!clash) return candidate;
  }
  throw new Error("Benzersiz referral kodu uretilemedi");
}

/**
 * GET /api/referral/generate?address=0x...
 * Kullaniciya referral kodu uretir; kodu zaten varsa mevcut kodu doner.
 */
async function generateCode(req, res, next) {
  try {
    const address = req.query.address
      ? String(req.query.address).toLowerCase().trim()
      : null;

    if (!address) {
      return res.status(400).json({ success: false, error: "address zorunludur" });
    }

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ success: false, error: "Kullanici bulunamadi" });
    }

    if (user.referralCode) {
      return res.status(200).json({ success: true, code: user.referralCode });
    }

    const code = await generateUniqueCode();
    user.referralCode = code;
    await user.save();

    return res.status(200).json({ success: true, code });
  } catch (err) {
    console.error("generateCode hatasi:", err);
    return next(err);
  }
}

/**
 * GET /api/referral/resolve?code=MON-XXXXXX
 * Referral kodunu davet eden cuzdan adresine cozumler (borrow referrer akisi icin).
 */
async function resolveCode(req, res, next) {
  try {
    const code = req.query.code ? String(req.query.code).trim() : null;
    if (!code) {
      return res.status(400).json({ success: false, error: "code zorunludur" });
    }

    const inviter = await User.findOne({ referralCode: code });
    if (!inviter) {
      return res.status(404).json({ success: false, error: "Referral kodu bulunamadi" });
    }

    return res.status(200).json({ success: true, inviterAddress: inviter.address });
  } catch (err) {
    console.error("resolveCode hatasi:", err);
    return next(err);
  }
}

module.exports = { generateCode, resolveCode };
