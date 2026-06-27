# AGENTS.md — Monad Ankara (Hackathon · kontrat katmanı)

## Rolüm

Bu repoda AI ajanlar **sadece kontrat katmanından** sorumludur (`contract/` + paylaşılan çıktılar).
Front ve back başka bir takım arkadaşında (`frontend/`, `backend/`).
Bu katmanın çıktısı onların **tüketeceği** arayüz — temiz adres + ABI üretmek işin yarısı.

## Editable Scope

AI ajanlar yalnızca `contract/` altındaki dosyaları düzenleyebilir.
`../frontend/` ve `../backend/` **salt okunur** — kullanıcı açıkça onaylamadan değiştirilemez.

## Hedef

Monad testnet üzerinde çalışan, güvenli ve test edilmiş akıllı kontrat(lar) üretmek.
Demo akışı: kullanıcı kontrat fonksiyonunu çağırır → state güncellenir → event yayılır.

> Hackathon modu: kapsam dar, **test edilmiş + çalışan kontrat** > fazla özellik.
> Talep edilmeyen fonksiyon ekleme.

## Stack & Ağ

| Alan | Detay |
|---|---|
| Araçlar | Foundry + Solidity, OpenZeppelin v5 |
| Ağ | Monad testnet — chain ID `10143`, RPC `https://testnet-rpc.monad.xyz` |
| Verify | Sourcify |

## MONSKILLS

Bu proje `therealharpaljadeja/monskills` skillini kullanır.

```bash
npx skills add therealharpaljadeja/monskills
```

Mevcut altyapı adresi (token, Multicall3, Permit2, WMON vb.) gerektiğinde
**ÖNCE `addresses` skillini oku** — adres uydurma, var olanı yeniden deploy etme.

Skill referansı için `https://skills.devnads.com/` de onaylı harici kaynak olarak kullanılabilir.

## Takım Handoff (front/back arkadaşa)

Her testnet deploy'undan sonra şunları üret/güncelle:

1. `shared/deployments/monad-testnet.json` → `{ contract, address, chainId, deployedAt }`
2. ABI'yi `shared/abi/[ContractName].json`'a kopyala (Foundry'nin `out/` yolu değil — sabit, import edilebilir yol).

**Kurallar:**
- Fonksiyon imzası veya event şeması değişirse bu **BREAKING** — önce arkadaşa haber ver.
- Adres/ABI değişince `shared/` güncellensin; arkadaşın entegrasyon noktası burası.

## Geliştirme Kuralları

1. **Önce TASARLA** (interface, state, event, revert), sonra yaz. Büyük değişiklikten önce plan modu.
2. Her adımda `forge build` + `forge test` yeşil olmadan ilerleme.
3. Kritik mantık için fuzz/invariant testi (bakiye, erişim kontrolü, state geçişleri).
4. Checks-Effects-Interactions; reentrancy'ye dikkat; erişim kontrolü açık.
5. Custom error kullan (`require` string yerine).
6. Küçük, sık commit. Secret/private key repoya girmez; `.env` `.gitignore`'da.
7. Deploy yalnızca testnet dev cüzdanıyla.

## Komutlar

```bash
# Derle
forge build

# Test
forge test -vvv

# Gas raporu
forge test --gas-report

# Deploy — shared/ otomatik güncellenir (adres + ABI)
bash script/deploy.sh

# Verify
forge verify-contract <adres> src/X.sol:X --verifier sourcify --chain 10143
```

## Yapı

```
contract/
  src/          ← kontrat kaynak kodları
  test/         ← Forge testleri
  script/       ← deploy scriptleri
  out/          ← Foundry derleme çıktısı (gitignore)

shared/         ← takım handoff
  deployments/
    monad-testnet.json
  abi/
    [ContractName].json
```

## Secrets ve Ortam Dosyaları

- Bu repo publiktir. **Gerçek private key, mnemonic veya secret commit etme.**
- Yalnızca `.env.example` gibi örnek dosyaları commit et.
- Gerçek değerler `.env` (gitignore'da) içinde kalsın.
