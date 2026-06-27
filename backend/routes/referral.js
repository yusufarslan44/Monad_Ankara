const express = require("express");
const { generateCode, resolveCode } = require("../controllers/referralController");

const router = express.Router();

router.get("/generate", generateCode);
router.get("/resolve", resolveCode);

module.exports = router;
