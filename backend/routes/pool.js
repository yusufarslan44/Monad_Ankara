const express = require("express");
const { ethers } = require("ethers");
const { getPoolSnapshot } = require("../services/poolService");

const router = express.Router();

/**
 * GET /api/pool?address=0x...
 * Havuzun genel metriklerini, kullanicinin yatirimlarini ve
 * cuzdan bakiyesini dondurur. Kullanici kaydi gerektirmez;
 * yatirimci modu icin uygundur.
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

    const data = await getPoolSnapshot(address);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("pool hatasi:", err.message);
    return next(err);
  }
});

module.exports = router;
