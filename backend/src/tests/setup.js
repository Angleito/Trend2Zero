import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
const setupTestDB = async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri); // Updated to remove deprecated options
    return {
        mongod,
        stop: async () => {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
            await mongod.stop();
        },
    };
};
// Fix for the TypeScript error: Ensure expiresIn is properly typed
const generateTestToken = (user) => {
    const payload = {
        id: user._id,
        expiresIn: '1h', // Explicitly cast to match StringValue
    };
    const options = {
        expiresIn: payload.expiresIn,
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'testsecret', options);
};
export { setupTestDB, generateTestToken };
