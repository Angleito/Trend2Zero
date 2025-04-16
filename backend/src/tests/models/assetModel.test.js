const { setupTestDB } = require('../setupTestDB');
const Asset = require('../../models/assetModel');

describe('Asset Model', () => {
    let db;
    beforeAll(async () => {
        db = await setupTestDB();
    });
    afterAll(async () => {
        await db.stop();
    });
    it('should create a new asset successfully', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            description: 'Test Description',
            currentPrice: 50000,
            change24h: 5
        };

        const asset = await Asset.create(assetData);

        expect(asset).toBeDefined();
        expect(asset._id).toBeDefined();
        expect(asset.symbol).toBe(assetData.symbol);
        expect(asset.name).toBe(assetData.name);
        expect(asset.type).toBe(assetData.type);
        expect(asset.description).toBe(assetData.description);
        expect(asset.currentPrice).toBe(assetData.currentPrice);
        expect(asset.change24h).toBe(assetData.change24h);
    });

    it('should not create an asset without required fields', async () => {
        const assetWithoutRequiredField = new Asset({
            name: 'Bitcoin'
        });
        await expect(assetWithoutRequiredField.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should not create an asset with duplicate symbol', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            currentPrice: 50000
        };
        await Asset.create(assetData);

        const duplicateAsset = new Asset({
            symbol: 'BTC',
            name: 'Bitcoin Clone',
            type: 'crypto',
            currentPrice: 51000
        });
        await expect(duplicateAsset.save()).rejects.toThrow(/duplicate key error/);
    });

    it('should update asset data correctly using methods', async () => {
        const initialAssetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            currentPrice: 50000,
            change24h: 5,
            volume24h: 1000000,
            marketCap: 900000000
        };
        const asset = await Asset.create(initialAssetData);

        const newPrice = 55000;
        await asset.updatePrice(newPrice);

        let updatedAsset = await Asset.findOne({ symbol: 'BTC' });
        expect(updatedAsset.currentPrice).toBe(newPrice);
        expect(updatedAsset.change24h).toBe(newPrice - initialAssetData.currentPrice);

        const newStats = {
            marketCap: 950000000,
            volume24h: 1200000
        };
        await asset.updateStats(newStats);

        updatedAsset = await Asset.findOne({ symbol: 'BTC' });
        expect(updatedAsset.marketCap).toBe(newStats.marketCap);
        expect(updatedAsset.volume24h).toBe(newStats.volume24h);
        expect(updatedAsset.currentPrice).toBe(newPrice);
    });

    it('should handle metadata correctly', async () => {
        const assetData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            currentPrice: 50000,
            description: 'Digital gold',
            metadata: {
                website: 'https://bitcoin.org',
                exchange: 'Various'
            }
        };

        const asset = await Asset.create(assetData);

        expect(asset.description).toBe(assetData.description);
        expect(asset.metadata).toBeDefined();
        expect(asset.metadata.website).toBe(assetData.metadata.website);
        expect(asset.metadata.exchange).toBe(assetData.metadata.exchange);
    });
});
