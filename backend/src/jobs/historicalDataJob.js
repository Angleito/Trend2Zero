const cron = require('node-cron');
const HistoricalDataService = require('../services/historicalDataService');
const logger = require('../utils/logger');

// Schedule job to run daily at midnight
function scheduleHistoricalDataJob() {
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting daily historical data collection job');
      const savedEntries = await HistoricalDataService.saveCurrentMarketData();
      logger.info(`Saved ${savedEntries.length} historical data entries`);
    } catch (error) {
      logger.error('Error in daily historical data collection job:', error);
    }
  });
}

module.exports = scheduleHistoricalDataJob;