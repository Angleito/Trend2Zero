const mongoose = require('mongoose');

const clearTestData = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
};

module.exports = {
    clearTestData
};