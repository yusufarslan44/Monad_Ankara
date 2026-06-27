const User = require("../models/User");
const CreditScore = require("../models/CreditScore");
const { gatherFeatures } = require("./creditFeatures");
const { scoreUser } = require("./aiCreditService");

/**
 * creditScoreWorker — arka planda periyodik olarak kayitli kullanicilarin
 * kredi-skorunu hesaplar; ayrica on-demand uclar tarafindan da kullanilir.
 */

const DEFAULT_INTERVAL_MS = 600000; // 10 dk
const USER_DELAY_MS = 500; // Gemini rate-limit icin kullanicilar arasi gecikme

let _timer = null;

function intervalMs() {
  const v = Number(process.env.CREDIT_SCORE_INTERVAL_MS);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_INTERVAL_MS;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Bir adres icin ozellikleri toplar, AI ile skorlar ve DB'ye yazar (upsert).
 * @param {string} address
 * @returns {Promise<object>} kaydedilen CreditScore belgesi
 */
async function scoreAndPersist(address) {
  const normalizedAddress = String(address).toLowerCase().trim();
  const features = await gatherFeatures(normalizedAddress);
  const result = await scoreUser(features);

  const doc = await CreditScore.findOneAndUpdate(
    { address: normalizedAddress },
    {
      $set: {
        score: result.score,
        riskBand: result.riskBand,
        trend: result.trend,
        factors: result.factors,
        recommendations: result.recommendations,
        summary: result.summary,
        source: result.source,
        features,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc;
}

/**
 * Tum kayitli kullanicilari sirayla tarar.
 * @param {{ force?: boolean }} opts force=true ise bayatlik kontrolu atlanir.
 */
async function runOnce(opts = {}) {
  const { force = false } = opts;
  const users = await User.find({ verified: true }).select("address").lean();

  let scored = 0;
  let skipped = 0;
  const freshnessMs = intervalMs();

  for (const user of users) {
    try {
      if (!force) {
        const existing = await CreditScore.findOne({ address: user.address }).select("updatedAt").lean();
        if (existing && Date.now() - new Date(existing.updatedAt).getTime() < freshnessMs) {
          skipped++;
          continue;
        }
      }
      await scoreAndPersist(user.address);
      scored++;
      if (USER_DELAY_MS > 0) await sleep(USER_DELAY_MS);
    } catch (err) {
      console.error(`Kredi skoru hesaplanamadi (${user.address}):`, err.message);
    }
  }

  console.log(`Kredi-skoru taramasi: ${scored} hesaplandi, ${skipped} atlandi (${users.length} kullanici).`);
  return { scored, skipped, total: users.length };
}

/** Periyodik tarama dongusunu baslatir (test ortaminda otomatik baslatilmaz). */
function start() {
  if (process.env.AI_SCORING_ENABLED === "false") {
    console.log("AI kredi-skoru worker'i devre disi (AI_SCORING_ENABLED=false).");
    return;
  }
  if (_timer) return;

  // Ilk turu kisa gecikmeyle calistir, sonra periyodik.
  const initial = setTimeout(() => {
    runOnce().catch((e) => console.error("Ilk kredi-skoru turu hatasi:", e.message));
  }, 5000);
  if (initial.unref) initial.unref();

  _timer = setInterval(() => {
    runOnce().catch((e) => console.error("Kredi-skoru turu hatasi:", e.message));
  }, intervalMs());
  if (_timer.unref) _timer.unref();

  console.log(`AI kredi-skoru worker'i basladi (her ${Math.round(intervalMs() / 1000)} sn).`);
}

/** Donguyu durdurur (test temizligi icin). */
function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

module.exports = { scoreAndPersist, runOnce, start, stop };
