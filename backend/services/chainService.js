const { ethers } = require("ethers");

/**
 * chainService — StudentID kontratiyla zincir uzerinde etkilesir.
 *
 * NOT: Kontratlar imza dogrulamaz. Backend'in tek ozel yetkisi, .edu.tr
 * dogrulamasi gecen cuzdani admin cuzdaniyla StudentID.register(address)
 * cagirarak kaydetmektir (Soulbound kampus kimligi mint'lenir).
 *
 * Referral, zincir uzerinde LendingPool.borrow(amount, referrer) ile islenir;
 * backend yalnizca davet eden adresi cozumler, imza uretmez.
 */

// Sadece backend'in ihtiyac duydugu fonksiyonlar (human-readable ABI).
const STUDENT_ID_ABI = [
  "function register(address student)",
  "function isRegistered(address student) view returns (bool)",
  "function revoke(address student)",
  "function isAdmin(address) view returns (bool)",
];

// Lazy init — modul require edildiginde degil, ilk kullanildiginda kurulur.
let _contract = null;

/**
 * shared/deployments/monad-testnet.json icindeki StudentID adresini okur.
 * Placeholder ("deploy sonrasi...") ise null doner.
 */
function resolveStudentIdAddress() {
  if (process.env.STUDENT_ID_ADDRESS && ethers.isAddress(process.env.STUDENT_ID_ADDRESS)) {
    return process.env.STUDENT_ID_ADDRESS;
  }
  try {
    const deployment = require("../../shared/deployments/monad-testnet.json");
    const addr = deployment?.contracts?.StudentID;
    if (addr && ethers.isAddress(addr)) return addr;
  } catch (_) {
    /* deployment dosyasi yoksa yok say */
  }
  return null;
}

/**
 * StudentID kontrat instance'ini (admin signer ile) dondurur.
 * Yapilandirma eksikse aciklayici hata firlatir.
 */
function getContract() {
  if (_contract) return _contract;

  const address = resolveStudentIdAddress();
  if (!address) {
    throw new Error(
      "StudentID kontrat adresi yapilandirilmamis (STUDENT_ID_ADDRESS veya shared deployment)"
    );
  }
  if (!process.env.ADMIN_PRIVATE_KEY) {
    throw new Error("ADMIN_PRIVATE_KEY tanimli degil");
  }

  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  _contract = new ethers.Contract(address, STUDENT_ID_ABI, adminWallet);

  // Startup'ta admin yetkisini doğrula (asenkron, bloklamamak için .catch ile)
  _contract.isAdmin(adminWallet.address).then((ok) => {
    if (!ok) {
      console.error(
        `[chainService] UYARI: ${adminWallet.address} StudentID kontratinda admin degil! ` +
        `register() cagirilari NotAdmin() ile revert edecek.`
      );
    } else {
      console.log(`[chainService] Admin dogrulandı: ${adminWallet.address}`);
    }
  }).catch(() => {});

  return _contract;
}

/**
 * Cuzdan StudentID'de kayitli mi?
 * @param {string} address
 * @returns {Promise<boolean>}
 */
async function isRegistered(address) {
  const contract = getContract();
  return contract.isRegistered(address);
}

/**
 * Cuzdani StudentID kontratina kaydeder (register).
 * Zaten kayitliysa zincir cagrisi yapmadan { alreadyRegistered: true } doner.
 *
 * @param {string} address — kucuk harf cuzdan adresi
 * @returns {Promise<{ txHash: string|null, alreadyRegistered: boolean }>}
 */
async function registerStudent(address) {
  const contract = getContract();

  const already = await contract.isRegistered(address);
  if (already) {
    return { txHash: null, alreadyRegistered: true };
  }

  const tx = await contract.register(address);
  const receipt = await tx.wait();
  return { txHash: receipt?.hash || tx.hash, alreadyRegistered: false };
}

module.exports = {
  STUDENT_ID_ABI,
  resolveStudentIdAddress,
  isRegistered,
  registerStudent,
};
