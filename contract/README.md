# Kampüs Nano-Lending — Kontrat Katmanı

Monad testnet üzerinde çalışan, teminatsız kampüs mikro-kredi protokolü.  
Öğrenciler `.edu.tr` e-posta doğrulamasından sonra sıfır teminatla MON borç alabilir.

---

## Kontratlar

### `StudentID.sol` — Soulbound Kampüs Kimliği

Her kayıtlı öğrenciye verilen, transfer edilemeyen NFT kimlik belgesi.

| Özellik | Detay |
|---|---|
| Standart | ERC-721 + ERC-5192 (Soulbound) |
| Transfer | Yasak — mint ve burn dışında |
| Kimlik doğrulama | Backend `.edu.tr` mailini doğrular, admin `register()` çağırır |
| Cüzdan kaybı | `reRegister(oldWallet, newWallet)` ile eski kimlik iptal, yeni basım |

**Fonksiyonlar:**

```
register(address student)              → Öğrenciyi sisteme ekle (admin)
revoke(address student)                → Kimliği iptal et — temerrüt / kötüye kullanım
reRegister(address old, address new)   → Cüzdan kaybında kimlik devri
setAdmin(address, bool)                → Admin yetkisi ver / al
isRegistered(address) → bool           → Kayıtlı mı?
locked(uint256) → true                 → ERC-5192: her zaman kilitli
```

---

### `LendingPool.sol` — Kredi Havuzu

Native MON üzerinden çalışan lending havuzu. Yatırımcılar MON yatırır, kayıtlı öğrenciler kredi çeker.

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `BASE_CREDIT` | 0.01 MON | Yeni öğrenci başlangıç limiti |
| `LIMIT_INCREMENT` | 0.005 MON | Her başarılı geri ödemede limit artışı |
| `REFERRAL_BONUS` | 0.002 MON | Referral bonusu (her iki tarafa) |
| `ANNUAL_RATE_BPS` | 500 | Yıllık faiz oranı (%5) |
| `MAX_BORROW_DURATION` | 30 gün | Maksimum borç süresi |

**Yatırımcı akışı:**
```
deposit()              → MON yatır, havuza likidite sağla
withdraw(amount)       → MON çek (yalnızca kendi yatırdığın kadar)
```

**Öğrenci akışı:**
```
borrow(amount, referrer)   → Kredi çek; referrer varsa her ikisine bonus
repay()                    → Borcu faizle öde (fazla gönderilen iade edilir)
currentDebt(address)       → Anlık borç (anapara + birikmiş faiz)
```

**Admin:**
```
markDefault(address)       → Vadesi geçmiş borç: limit sıfırla + kimliği iptal et
setParameters(...)         → Sistem parametrelerini güncelle
```

**Faiz hesabı (lineer):**
```
faiz = anapara × yıllık_oran × geçen_süre / (10000 × 365 gün)
```

**Kredi limiti büyümesi:**
```
Yeni öğrenci    → BASE_CREDIT (0.01 MON)
Her geri ödeme  → +LIMIT_INCREMENT (0.005 MON)
Referral bonusu → +REFERRAL_BONUS (0.002 MON) — her iki tarafa, bir kez
Temerrüt        → limit = 0, kimlik iptal
```

---

## Deploy

### Gereksinimler

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Monad testnet MON (faucet: [testnet.monad.xyz](https://testnet.monad.xyz))

### Kurulum

```bash
cd contract
cp .env.example .env
# .env içine PRIVATE_KEY ve DEPLOYER_ADDRESS değerlerini gir
forge install
```

> **DEPLOYER_ADDRESS** nedir?  
> `PRIVATE_KEY`'in karşılık geldiği cüzdanın public adresidir.  
> MetaMask'ta `Account` bölümünde görünen `0x...` adresi — aynı cüzdanın iki farklı gösterimi.

### Deploy

```bash
bash script/deploy.sh
```

Script otomatik olarak şunları yapar:
1. `StudentID` kontratını deploy eder
2. `LendingPool` kontratını deploy eder ve StudentID adresini bağlar
3. `LendingPool`'u StudentID admini yapar (temerrüt revoke için)
4. `shared/deployments/monad-testnet.json` ve `shared/abi/*.json` dosyalarını günceller

### Verify (opsiyonel)

```bash
forge verify-contract <StudentID_adresi> src/StudentID.sol:StudentID \
  --verifier sourcify --chain 10143

forge verify-contract <LendingPool_adresi> src/LendingPool.sol:LendingPool \
  --verifier sourcify --chain 10143
```

---

## Test

```bash
# Tüm testler
forge test -vvv

# Gas raporu
forge test --gas-report

# Sadece belirli kontrat
forge test --match-contract StudentIDTest -vvv
forge test --match-contract LendingPoolTest -vvv
forge test --match-contract LendingPoolInvariantTest -vvv
```

**Test kapsamı:**

| Suite | Adet | Tip |
|---|---|---|
| `StudentID.t.sol` | 11 | Unit |
| `LendingPool.t.sol` | 18 | Unit + Fuzz |
| `LendingPool.invariant.t.sol` | 3 | Invariant (128k çağrı) |

**Invariant testleri:**
- `totalDeposited ≥ totalBorrowed` her zaman
- `availableLiquidity` asla negatif değil
- Kontrat bakiyesi en az `availableLiquidity` kadar

---

## Frontend / Backend Entegrasyonu

Deploy sonrası `shared/` klasörü otomatik güncellenir:

```
shared/
  deployments/monad-testnet.json   ← adres, chainId, txHash
  abi/
    StudentID.json
    LendingPool.json
```

> Entegrasyon noktası burası. `contract/out/` değil, `shared/` klasörünü kullan.

**Kritik: ABI değişikliği = Breaking change**  
Fonksiyon imzası veya event şeması değişirse frontend/backend ekibi önceden bilgilendirilmeli.

---

## Stack

| Alan | Teknoloji |
|---|---|
| Dil | Solidity `^0.8.24` |
| Framework | Foundry |
| Kütüphane | OpenZeppelin Contracts v5 |
| Ağ | Monad testnet (chain ID: 10143) |
| RPC | `https://testnet-rpc.monad.xyz` |
| Verify | Sourcify |
