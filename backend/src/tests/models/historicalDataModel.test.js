const { setupTestDB } = require('../setupTestDB');
const HistoricalData = require('../../models/historicalDataModel');

describe('Historical Data Model', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDB();
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await HistoricalData.deleteMany({});
  });

  it('should create historical data successfully', async () => {
    const historicalData = await HistoricalData.create({
      symbol: 'BTC',
      date: new Date(),
      price: 50000,
      open: 50000,
      high: 50000,
      low: 50000,
      category: 'Crypto',
      volume: 1000000000,
      timeframe: 'daily',
      currency: 'USD'
    });

    expect(historicalData).toBeDefined();
    expect(historicalData._id).toBeDefined();
    expect(historicalData.symbol).toBe('BTC');
    expect(historicalData.price).toBe(50000);
    expect(historicalData.open).toBe(50000);
    expect(historicalData.high).toBe(50000);
    expect(historicalData.low).toBe(50000);
    expect(historicalData.category).toBe('Crypto');
  });

  it('should not create historical data without required fields', async () => {
    const historicalDataWithoutRequiredField = new HistoricalData({});
    await expect(historicalDataWithoutRequiredField.save()).rejects.toThrow();
  });

  it('should enforce unique compound index on symbol and date', async () => {
    await HistoricalData.create({
      symbol: 'BTC',
      date: new Date(),
      price: 50000,
      open: 50000,
      high: 50000,
      low: 50000,
      category: 'Crypto',
      volume: 1000000000
    });

    const duplicate = new HistoricalData({
      symbol: 'BTC',
      date: new Date(),
      price: 50001,
      open: 50001,
      high: 50001,
      low: 50001,
      category: 'Crypto',
      volume: 1000000001
    });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it('should allow different dates for the same symbol', async () => {
    await HistoricalData.create({
      symbol: 'BTC',
      date: new Date('2023-01-01'),
      price: 50000,
      open: 50000,
      high: 50000,
      low: 50000,
      category: 'Crypto',
      volume: 1000000000,
      timeframe: 'daily',
      currency: 'USD'
    });

    const another = await HistoricalData.create({
      symbol: 'BTC',
      date: new Date('2023-01-02'),
      price: 50001,
      open: 50001,
      high: 50001,
      low: 50001,
      category: 'Crypto',
      volume: 1000000001
    });

    expect(another).toBeDefined();
  });

  it('should allow different categories for the same symbol', async () => {
    await HistoricalData.create({
      symbol: 'BTC',
      date: new Date(),
      price: 50000,
      open: 50000,
      high: 50000,
      low: 50000,
      category: 'Crypto',
      volume: 1000000000
    });

    const another = await HistoricalData.create({
      symbol: 'BTC',
      date: new Date(),
      price: 50001,
      open: 50001,
      high: 50001,
      low: 50001,
      category: 'Stock',
      volume: 1000000001
    });

    expect(another.category).toBe('Stock');
  });

  it('should update historical data correctly', async () => {
    const historicalData = await HistoricalData.create({
      symbol: 'BTC',
      date: new Date(),
      price: 50000,
      open: 50000,
      high: 50000,
      low: 50000,
      category: 'Crypto',
      volume: 1000000000
    });

    historicalData.price = 55000;
    historicalData.open = 55000;
    historicalData.high = 55000;
    historicalData.low = 55000;
    await historicalData.save();

    const updated = await HistoricalData.findById(historicalData._id);
    expect(updated.price).toBe(55000);
  });
});
