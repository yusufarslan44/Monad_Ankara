const nodemailer = require("nodemailer");

/**
 * emailService — dogrulama kodu e-postasi gonderir.
 *
 * SMTP yapilandirilmamissa (SMTP_HOST bos) kod e-posta yerine sunucu konsoluna
 * yazilir (lokal gelistirme/giris testi icin). Gercek gonderim hatasinda throw eder.
 */

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST) return null;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // 465 -> SSL, digerleri STARTTLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  return _transporter;
}

/**
 * Dogrulama kodunu e-posta ile gonderir.
 * @param {string} email
 * @param {string} code
 */
async function sendVerificationCode(email, code) {
  const transporter = getTransporter();

  // Dev modu: SMTP yoksa konsola yaz.
  if (!transporter) {
    console.log(`[DEV] ${email} icin dogrulama kodu: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Monad Kampus <no-reply@monadkampus.xyz>",
      to: email,
      subject: "Monad Kampus Dogrulama Kodunuz",
      text: `Dogrulama kodunuz: ${code}`,
    });
  } catch (err) {
    console.error("E-posta gonderim hatasi:", err.message);
    throw new Error("Dogrulama e-postasi gonderilemedi");
  }
}

module.exports = { sendVerificationCode };
