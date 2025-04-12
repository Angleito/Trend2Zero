import mongoose from 'mongoose';
import logger from '../../utils/logger';

export const setupDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Test database connected');
    return {
      connection,
      disconnect: async () => {
        await mongoose.connection.close();
      }
    };
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  }
};

export default setupDatabase;