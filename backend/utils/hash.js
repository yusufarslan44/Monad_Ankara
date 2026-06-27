const { ethers } = require("ethers");

/**
 * E-postanin keccak256 hash'ini uretir (Sybil kontrolu icin).
 * Format: ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase().trim()))
 * Donus: 0x ile baslayan 66 karakterlik hex string.
 *
 * @param {string} email
 * @returns {string} emailHash
 */
function emailHash(email) {
  if (typeof email !== "string") {
    throw new Error("email bir string olmalidir");
  }
  return ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase().trim()));
}

module.exports = { emailHash };
