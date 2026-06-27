const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

/** Bellek ici MongoDB baslatir ve mongoose'u baglar. */
async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

/** Tum koleksiyonlari temizler (testler arasi izolasyon). */
async function clearDatabase() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/** Baglantiyi kapatir ve bellek ici sunucuyu durdurur. */
async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clearDatabase, closeDatabase };
