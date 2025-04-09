const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HistoricalData = require('../../models/historicalDataModel');

describe('Historical Data Model', () => {
  let mongoServer;

  beforeAll(async () => {
    // Create an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Disconnect from the database and stop the server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database collections
    await HistoricalData.deleteMany({});
  });

  it('should create historical data successfully', async () => {
    const now = new Date();
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 50000 - (i * 100),
        volume: 1000000000 - (i * 10000000)
      };
    });
    
    const historicalDataObj = {
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD',
      dataPoints,
      startDate: dataPoints[dataPoints.length - 1].date,
      endDate: dataPoints[0].date,
      lastUpdated: now
    };

    const historicalData = await HistoricalData.create(historicalDataObj);

    // Assertions
    expect(historicalData).toBeDefined();
    expect(historicalData._id).toBeDefined();
    expect(historicalData.assetSymbol).toBe(historicalDataObj.assetSymbol);
    expect(historicalData.timeframe).toBe(historicalDataObj.timeframe);
    expect(historicalData.currency).toBe(historicalDataObj.currency);
    expect(historicalData.dataPoints).toHaveLength(30);
    expect(historicalData.startDate).toEqual(historicalDataObj.startDate);
    expect(historicalData.endDate).toEqual(historicalDataObj.endDate);
    expect(historicalData.lastUpdated).toEqual(historicalDataObj.lastUpdated);
  });

  it('should not create historical data without required fields', async () => {
    const historicalDataWithoutRequiredField = new HistoricalData({
      timeframe: 'daily',
      currency: 'USD'
    });
    
    // Try to save and expect it to fail
    await expect(historicalDataWithoutRequiredField.save()).rejects.toThrow();
  });

  it('should enforce unique compound index on assetSymbol, timeframe, and currency', async () => {
    // Create first historical data
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 50000 - (i * 100),
        volume: 1000000000 - (i * 10000000)
      };
    });
    
    await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD',
      dataPoints,
      startDate: dataPoints[dataPoints.length - 1].date,
      endDate: dataPoints[0].date,
      lastUpdated: new Date()
    });

    // Try to create second historical data with same compound key
    const duplicateHistoricalData = new HistoricalData({
      assetSymbol: 'BTC', // Same
      timeframe: 'daily', // Same
      currency: 'USD', // Same
      dataPoints: dataPoints.slice(0, 10), // Different data points
      startDate: dataPoints[9].date,
      endDate: dataPoints[0].date,
      lastUpdated: new Date()
    });

    // Try to save and expect it to fail
    await expect(duplicateHistoricalData.save()).rejects.toThrow();
  });

  it('should allow different timeframes for the same asset', async () => {
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 50000 - (i * 100),
        volume: 1000000000 - (i * 10000000)
      };
    });
    
    // Create daily historical data
    await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD',
      dataPoints,
      startDate: dataPoints[dataPoints.length - 1].date,
      endDate: dataPoints[0].date,
      lastUpdated: new Date()
    });

    // Create weekly historical data for the same asset
    const weeklyDataPoints = Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return {
        date,
        price: 50000 - (i * 500),
        volume: 5000000000 - (i * 100000000)
      };
    });
    
    const weeklyHistoricalData = await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'weekly',
      currency: 'USD',
      dataPoints: weeklyDataPoints,
      startDate: weeklyDataPoints[weeklyDataPoints.length - 1].date,
      endDate: weeklyDataPoints[0].date,
      lastUpdated: new Date()
    });

    // Assertions
    expect(weeklyHistoricalData).toBeDefined();
    expect(weeklyHistoricalData.timeframe).toBe('weekly');
    expect(weeklyHistoricalData.dataPoints).toHaveLength(10);
  });

  it('should allow different currencies for the same asset', async () => {
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 50000 - (i * 100),
        volume: 1000000000 - (i * 10000000)
      };
    });
    
    // Create USD historical data
    await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD',
      dataPoints,
      startDate: dataPoints[dataPoints.length - 1].date,
      endDate: dataPoints[0].date,
      lastUpdated: new Date()
    });

    // Create BTC historical data for the same asset
    const btcDataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 1 - (i * 0.001),
        volume: 20000 - (i * 100)
      };
    });
    
    const btcHistoricalData = await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'BTC',
      dataPoints: btcDataPoints,
      startDate: btcDataPoints[btcDataPoints.length - 1].date,
      endDate: btcDataPoints[0].date,
      lastUpdated: new Date()
    });

    // Assertions
    expect(btcHistoricalData).toBeDefined();
    expect(btcHistoricalData.currency).toBe('BTC');
    expect(btcHistoricalData.dataPoints).toHaveLength(30);
  });

  it('should update historical data correctly', async () => {
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 50000 - (i * 100),
        volume: 1000000000 - (i * 10000000)
      };
    });
    
    // Create historical data
    const historicalData = await HistoricalData.create({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD',
      dataPoints,
      startDate: dataPoints[dataPoints.length - 1].date,
      endDate: dataPoints[0].date,
      lastUpdated: new Date()
    });

    // Update historical data
    const newDataPoints = Array.from({ length: 31 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        price: 55000 - (i * 100),
        volume: 1100000000 - (i * 10000000)
      };
    });
    
    historicalData.dataPoints = newDataPoints;
    historicalData.startDate = newDataPoints[newDataPoints.length - 1].date;
    historicalData.endDate = newDataPoints[0].date;
    historicalData.lastUpdated = new Date();
    
    await historicalData.save();

    // Fetch updated historical data
    const updatedHistoricalData = await HistoricalData.findOne({
      assetSymbol: 'BTC',
      timeframe: 'daily',
      currency: 'USD'
    });
    
    // Assertions
    expect(updatedHistoricalData.dataPoints).toHaveLength(31);
    expect(updatedHistoricalData.dataPoints[0].price).toBe(55000);
  });
});
