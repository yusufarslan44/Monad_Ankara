# shared/ — Kontrat Entegrasyon Noktası

Bu klasör **kontrat ekibinin** her deploy sonrası otomatik güncellediği çıktıları içerir.  
Frontend ve backend ekibi yalnızca bu klasörü kullanır — `contract/` klasörüne dokunmaz.

---

## Dosyalar

```
shared/
  deployments/
    monad-testnet.json   ← kontrat adresleri + deploy meta
  abi/
    StudentID.json       ← StudentID kontrat ABI
    LendingPool.json     ← LendingPool kontrat ABI
```

### `deployments/monad-testnet.json`

```json
{
  "chainId": 10143,
  "contracts": {
    "StudentID":   "0x...",
    "LendingPool": "0x..."
  }
}
```

### `abi/LendingPool.json` — Önemli fonksiyonlar

| Fonksiyon | Kim çağırır | Açıklama |
|---|---|---|
| `deposit()` payable | Yatırımcı | MON gönder, havuza ekle |
| `withdraw(uint256)` | Yatırımcı | MON çek |
| `borrow(uint256, address)` | Öğrenci | Kredi çek; 2. arg referrer (yoksa `0x000...0`) |
| `repay()` payable | Öğrenci | Borcu öde — fazla gönderilen iade edilir |
| `currentDebt(address)` view | Herkes | Anlık borç (anapara + faiz) |
| `creditLimit(address)` view | Herkes | Öğrencinin mevcut kredi limiti |
| `availableLiquidity()` view | Herkes | Havuzdaki çekilebilir MON |

### `abi/StudentID.json` — Önemli fonksiyonlar

| Fonksiyon | Kim çağırır | Açıklama |
|---|---|---|
| `register(address)` | Backend (admin) | .edu.tr doğrulama sonrası öğrenci kaydı |
| `isRegistered(address)` view | Herkes | Cüzdan kayıtlı mı? |
| `revoke(address)` | Backend (admin) | Kimliği iptal et |

---

## Frontend Kullanımı (ethers.js / viem)

### Kurulum

```bash
npm install ethers        # veya
npm install viem
```

### Adresleri ve ABI'yi içe aktar

```js
import deployment from '../shared/deployments/monad-testnet.json'
import lendingPoolAbi from '../shared/abi/LendingPool.json'
import studentIDAbi from '../shared/abi/StudentID.json'

const LENDING_POOL = deployment.contracts.LendingPool
const STUDENT_ID   = deployment.contracts.StudentID
```

### ethers.js örnekleri

```js
import { ethers } from 'ethers'

// Monad testnet bağlantısı
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz')
const signer   = await provider.getSigner()   // MetaMask / cüzdan

// Kontrat örnekleri
const pool = new ethers.Contract(LENDING_POOL, lendingPoolAbi, signer)
const sid  = new ethers.Contract(STUDENT_ID,   studentIDAbi,   provider)

// Öğrenci kayıtlı mı?
const registered = await sid.isRegistered(userAddress)

// Anlık borç
const debt = await pool.currentDebt(userAddress)
console.log(ethers.formatEther(debt), 'MON')

// Kredi çek (0.005 MON, referral yok)
const tx = await pool.borrow(
  ethers.parseEther('0.005'),
  ethers.ZeroAddress,           // referrer yoksa
)
await tx.wait()

// Borcunu öde (currentDebt kadar MON gönder)
const tx2 = await pool.repay({ value: debt })
await tx2.wait()

// Yatırımcı: 0.1 MON yatır
const tx3 = await pool.deposit({ value: ethers.parseEther('0.1') })
await tx3.wait()
```

### viem örnekleri

```ts
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
}

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() })

// Öğrenci kayıtlı mı?
const registered = await publicClient.readContract({
  address: STUDENT_ID,
  abi: studentIDAbi,
  functionName: 'isRegistered',
  args: [userAddress],
})

// Kredi çek
const { request } = await publicClient.simulateContract({
  address: LENDING_POOL,
  abi: lendingPoolAbi,
  functionName: 'borrow',
  args: [parseEther('0.005'), '0x0000000000000000000000000000000000000000'],
  account: userAddress,
})
await walletClient.writeContract(request)
```

---

## Backend Kullanımı (Node.js + ethers.js)

Backend'in tek özel yetkisi: `.edu.tr` doğrulaması yapıldıktan sonra `register()` çağırmak.

```js
import { ethers } from 'ethers'
import deployment from '../shared/deployments/monad-testnet.json' assert { type: 'json' }
import studentIDAbi from '../shared/abi/StudentID.json' assert { type: 'json' }

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz')

// Admin private key — .env'de sakla, koda yazma
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)

const sid = new ethers.Contract(
  deployment.contracts.StudentID,
  studentIDAbi,
  adminWallet   // yazma işlemi için signer gerekli
)

// .edu.tr doğrulaması geçtikten sonra:
async function registerStudent(walletAddress) {
  const already = await sid.isRegistered(walletAddress)
  if (already) throw new Error('Already registered')

  const tx = await sid.register(walletAddress)
  await tx.wait()
  console.log(`Registered: ${walletAddress}`)
}
```

---

## Events — Frontend'de Dinleme

```js
// Yeni borrow olduğunda
pool.on('Borrowed', (student, amount, creditLimit, event) => {
  console.log(`${student} borrowed ${ethers.formatEther(amount)} MON`)
})

// Geri ödeme
pool.on('Repaid', (student, principal, interest) => {
  console.log(`Repaid — interest earned: ${ethers.formatEther(interest)} MON`)
})

// Referral bonusu verildi
pool.on('ReferralBonusGranted', (referrer, referee, bonus) => {
  console.log(`Referral! ${referrer} → ${referee}`)
})
```

---

## Kurallar

- Bu klasördeki dosyaları **elle düzenleme** — kontrat ekibi `deploy.sh` ile otomatik günceller.
- `contract/out/` klasörünü **kullanma** — yollar değişebilir, bu klasör `.gitignore`'da.
- ABI değişikliği = **breaking change** — kontrat ekibi önceden haber verir.