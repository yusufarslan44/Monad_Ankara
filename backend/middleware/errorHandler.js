/**
 * Global hata yoneticisi — tum beklenmeyen hatalari tek formatta dondurur.
 * { success: false, error: "Mesaj" }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("Beklenmeyen hata:", err);

  // Mongoose duplicate key (ornek: ayni emailHash/address)
  if (err && err.code === 11000) {
    return res.status(409).json({ success: false, error: "Kayit zaten mevcut" });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Sunucu hatasi";

  return res.status(status).json({ success: false, error: message });
}

module.exports = errorHandler;
