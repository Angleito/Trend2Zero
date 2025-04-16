const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function setupTestDB() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return {
    mongod,
    stop: async () => {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await mongod.stop();
    },
  };
}

module.exports = {
  setupTestDB,
};
