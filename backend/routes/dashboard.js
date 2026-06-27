const express = require("express");
const { getDashboardSnapshot } = require("../services/chainDataService");
const { ethers } = require("ethers");

const router = express.Router();

/**
 * GET /api/dashboard?address=0x...
 * Adresin dashboard snapshot'ini dondurur. On-chain veri okunamazsa
 * demo/fallback veri doner.
 */
router.get("/", async (req, res, next) => {
  try {
    const address = req.query.address ? String(req.query.address).trim() : null;

    if (!address) {
      return res.status(400).json({ success: false, error: "address zorunludur" });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ success: false, error: "Gecersiz cuzdan adresi" });
    }

    const snapshot = await getDashboardSnapshot(address);

    if (!snapshot) {
      return res.status(404).json({ success: false, error: "Kullanici bulunamadi" });
    }

    return res.status(200).json({ success: true, data: snapshot });
  } catch (err) {
    console.error("dashboard hatasi:", err.message);
    return next(err);
  }
});

module.exports = router;
