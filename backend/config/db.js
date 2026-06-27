const mongoose = require("mongoose");

/**
 * MongoDB Atlas baglantisini kurar.
 * MONGO_URI ortam degiskenini kullanir; baglanti basarisiz olursa process'i sonlandirir.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI / MONGODB_URI tanimli degil");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log("MongoDB baglantisi kuruldu");
  } catch (err) {
    console.error("MongoDB baglanti hatasi:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
