const mongoose = require('mongoose');
const Asset = require('../../models/assetModel');
const { setupTestDatabase, clearTestDatabase, closeTestDatabase } = require('../helpers/testDb');

describe('Asset Model', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    beforeEach(async () => {
        await clearTestDatabase();
    });

    afterAll(async () => {
        await closeTestDatabase();
    });

    it('should create a new asset successfully', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            currentData: {
                priceInUSD: 50000,
                priceInBTC: 1,
                change24h: 5
            }
        };

        const asset = await Asset.create(assetData);

        expect(asset).toBeDefined();
        expect(asset._id).toBeDefined();
        expect(asset.symbol).toBe(assetData.symbol);
        expect(asset.name).toBe(assetData.name);
        expect(asset.type).toBe(assetData.type);
        expect(asset.currentData.priceInUSD).toBe(assetData.currentData.priceInUSD);
    });

    it('should not create an asset without required fields', async () => {
        const assetWithoutRequiredField = new Asset({
            name: 'Bitcoin'
            // Missing required fields: symbol and type
        });

        await expect(assetWithoutRequiredField.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should not create an asset with duplicate symbol', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto'
        };

        await Asset.create(assetData);

        const duplicateAsset = new Asset({
            symbol: 'BTC',
            name: 'Bitcoin Clone',
            type: 'crypto'
        });

        await expect(duplicateAsset.save()).rejects.toThrow(mongoose.Error.MongoError);
    });

    it('should update asset data correctly', async () => {
        const asset = await Asset.create({
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            currentData: {
                priceInUSD: 50000,
                priceInBTC: 1,
                change24h: 5
            }
        });

        const newPrice = 55000;
        await asset.updatePriceData({
            priceInUSD: newPrice,
            change24h: 10
        });

        const updatedAsset = await Asset.findOne({ symbol: 'BTC' });
        expect(updatedAsset.currentData.priceInUSD).toBe(newPrice);
        expect(updatedAsset.currentData.change24h).toBe(10);
    });

    it('should handle additional fields correctly', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            metadata: {
                description: 'Digital gold',
                website: 'https://bitcoin.org'
            }
        };

        const asset = await Asset.create(assetData);
        expect(asset.metadata.description).toBe(assetData.metadata.description);
        expect(asset.metadata.website).toBe(assetData.metadata.website);
    });

    it('should handle returns data correctly', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            returns: {
                daily: 5,
                weekly: 10,
                monthly: 20,
                yearly: 100
            }
        };

        const asset = await Asset.create(assetData);
        expect(asset.returns.daily).toBe(assetData.returns.daily);
        expect(asset.returns.yearly).toBe(assetData.returns.yearly);
    });

    it('should handle metadata correctly', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            metadata: {
                description: 'Digital gold',
                website: 'https://bitcoin.org',
                whitepaper: 'https://bitcoin.org/bitcoin.pdf',
                github: 'https://github.com/bitcoin/bitcoin',
                explorer: 'https://blockchain.info'
            }
        };

        const asset = await Asset.create(assetData);
        expect(asset.metadata).toEqual(assetData.metadata);
    });
});
