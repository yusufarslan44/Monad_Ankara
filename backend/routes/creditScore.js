const express = require("express");
const { getScore, refreshScore } = require("../controllers/creditScoreController");

const router = express.Router();

router.get("/", getScore);
router.post("/refresh", refreshScore);

module.exports = router;
