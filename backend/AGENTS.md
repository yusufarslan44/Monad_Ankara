Markdown
# Monad Kampüs Backend – AI Geliştirme Kılavuzu (Sistem Promptu)

Bu belge, Monad Kampüs projesinin backend kısmını (Node.js, Express, MongoDB Atlas, ethers.js v6) inşa edecek AI asistanı için eksiksiz ve kesin bir başvuru kaynağıdır. **Yalnızca `backend/` dizini düzenlenebilir.** Kesinlikle Frontend veya akıllı kontrat kodu yazılmaz.

---

## 1. Genel Kurallar & Klasör Yapısı
- Kodlama dili **JavaScript (ES6+)**'tir. TypeScript kullanılmaz.
- Tüm cüzdan adresleri (`address`, `inviterAddress` vb.) DB'ye yazılmadan veya sorgulanmadan önce `.toLowerCase()` ile normalize edilmelidir.
- `emailHash` her zaman `ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase().trim()))` formülüyle üretilir.

```text
backend/
├── .env (Örnek değerlerle oluşturulmalı, gerçek gizli anahtarlar commit edilmemeli)
├── package.json (express, mongoose, dotenv, ethers, nodemailer kurulumları)
├── server.js (Express, CORS, express.json, DB bağlantısı, rotalar ve global hata yönetimi)
├── config/db.js (MongoDB Atlas Mongoose bağlantısı)
├── models/ (User.js, VerificationCode.js)
├── routes/ (auth.js, referral.js)
├── controllers/ (authController.js, referralController.js)
├── services/ (oracleService.js, emailService.js)
├── middleware/errorHandler.js
└── tests/ (auth.test.js, referral.test.js -> Jest + Supertest + mongodb-memory-server)
2. Veritabanı Modelleri (Mongoose)
User Modeli (models/User.js):

address (String, Zorunlu, Benzersiz, Küçük Harf)

emailHash (String, Zorunlu, Benzersiz, 66 karakterli 0x ile başlayan hex string)

emailDomain (String, Zorunlu değil, e-postanın domain kısmı)

verified (Boolean, Varsayılan: true)

previousAddresses (Array [String], Varsayılan: [])

referralCode (String, Benzersiz, Seyrek, Varsayılan: null)

inviterAddress (String, Küçük Harf, Varsayılan: null)

createdAt (Date, Varsayılan: Date.now)

VerificationCode Modeli (models/VerificationCode.js):

email (String, Zorunlu)

code (String, Zorunlu, 6 haneli sayısal kod)

address (String, Zorunlu, Küçük Harf)

referralCode (String, Varsayılan: null)

expiresAt (Date, Zorunlu) -> Kritik: Bu alana { expireAfterSeconds: 0 } ile TTL Index kurulmalıdır.

used (Boolean, Varsayılan: false)

createdAt (Date, Varsayılan: Date.now)

3. Servis Katmanı
Oracle Servisi (services/oracleService.js):

SIGNER_PRIVATE_KEY ortam değişkeniyle ethers.Wallet oluşturulmalıdır.

İmza üretimi kesinlikle wallet.signingKey.sign(ethers.getBytes(messageHash)).serialized ile yapılmalı (kontrat uyumluluğu için 0x ile başlayan ham hex string dönmelidir).

generateSBTMintSignature(studentAddress, emailHash, expiryMinutes = 15)

timestamp = Math.floor(Date.now() / 1000) , expiry = timestamp + expiryMinutes * 60

messageHash = ethers.solidityPackedKeccak256(['address','bytes32','uint256','uint256'], [studentAddress, emailHash, timestamp, expiry])

Dönüş: { signature, params: { student: studentAddress, emailHash, timestamp, expiry } }

generateReferralSignature(inviter, newUser, amountWei, expiryMinutes = 15)

messageHash = ethers.solidityPackedKeccak256(['address','address','uint256','uint256','uint256'], [inviter, newUser, amountWei, timestamp, expiry])

Dönüş: { signature, params: { inviter, newUser, amount: amountWei, timestamp, expiry } }

E-posta Servisi (services/emailService.js):

sendVerificationCode(email, code): nodemailer ve .env SMTP ayarlarıyla "Monad Kampüs Doğrulama Kodunuz" konulu, "Doğrulama kodunuz: " gövdeli sade e-posta gönderir. Hata durumunda throw eder.

4. Controller İş Mantığı & Rotalar
POST /api/auth/request-code -> authController.requestCode
req.body.address ve req.body.email girdilerini al. Adresi .toLowerCase() yap.

E-posta formatını doğrula: /^[^\s@]+@[^\s@]+\.edu\.tr$/i. Uygun değilse: 400 { error: "Sadece .edu.tr e-postalar kabul edilir" }.

Son 60 saniye içinde bu e-postaya ait aktif bir VerificationCode var mı kontrol et. Varsa: 429 { error: "Lütfen 1 dakika bekleyin" }.

emailHash hesapla. User.findOne({ emailHash, verified: true }) kontrolü yap, varsa: 400 { error: "Bu e-posta zaten doğrulanmış" }.

crypto.randomInt(100000, 999999) ile 6 haneli kod üret.

DB'ye kaydet (expiresAt: Date.now() + 15 * 60 * 1000) ve e-postayı gönder. 200 { success: true, message: "Kod gönderildi" }.

POST /api/auth/verify-code -> authController.verifyCode
req.body üzerinden email, code ve address (.toLowerCase()) değerlerini al.

DB'den email, code, used: false ve expiresAt: { $gt: new Date() } şartlarına uyan kodu bul. Yoksa: 400 { error: "Geçersiz veya süresi dolmuş kod" }.

Cüzdan Eşleşme Kontrolü: verification.address !== address ise 400 { error: "Kod farklı cüzdan için alınmış" } dön.

Sybil Kontrolü: emailHash hesapla, bu hash ile doğrulanmış kullanıcı (verified: true) varsa 400 { error: "Bu e-posta zaten doğrulanmış" } dön.

generateSBTMintSignature(address, emailHash) ile SBT imzası üret.

Referans Kontrolü: Eğer verification.referralCode varsa User.findOne ile davet edeni bul. Varsa generateReferralSignature(inviter.address, address, "50000000000000000000") (50 MON wei) ile referans imzası üret. Yoksa referral: null ata.

Yeni User oluştur (veya mevcut cüzdan kaydını güncelle): address, emailHash, emailDomain: email.split('@')[1], inviterAddress, verified: true.

Kod belgesini used: true yap. 200 { success: true, sbtSignature, sbtParams, referral }.

GET /api/referral/generate -> referralController.generateCode
req.query.address.toLowerCase() parametresini al. Kullanıcıyı ara, yoksa 404.

Kullanıcının zaten referralCode alanı doluysa mevcut kodu dön.

Kodu yoksa, while döngüsü içinde User.findOne ile çakışma kontrolü yaparak benzersiz bir kod üret: "MON-" + crypto.randomBytes(3).toString('hex').toUpperCase().

Kullanıcı belgesini güncelle. 200 { success: true, code }.

5. Hata Yönetimi & Testler
Tüm controller metotları try-catch bloklarıyla sarılmalı, hatalar console.error ile loglanmalı ve middleware/errorHandler.js vasıtasıyla { success: false, error: "Mesaj" } formatında dönmelidir.

Test dosyaları (tests/) yukarıda belirtilen tüm başarılı akışları, geçersiz e-posta/kod denemelerini, 60sn rate-limit sınırını, cüzdan uyuşmazlıklarını ve referans çakışma senaryolarını Jest ile tam kapsamlı test etmelidir.