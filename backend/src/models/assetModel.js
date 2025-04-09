const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: [true, 'Asset must have a symbol'],
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Asset must have a name'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Asset must have a type'],
        enum: ['stock', 'crypto', 'commodity', 'forex'],
        default: 'stock'
    },
    description: {
        type: String,
        trim: true
    },
    currentPrice: {
        type: Number,
        required: [true, 'Asset must have a current price']
    },
    marketCap: {
        type: Number
    },
    volume24h: {
        type: Number
    },
    change24h: {
        type: Number
    },
    high24h: {
        type: Number
    },
    low24h: {
        type: Number
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    metadata: {
        exchange: String,
        sector: String,
        industry: String,
        website: String,
        logo: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
assetSchema.index({ symbol: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ marketCap: -1 });
assetSchema.index({ volume24h: -1 });

// Virtual properties
assetSchema.virtual('priceChange').get(function() {
    return {
        absolute: this.change24h,
        percentage: (this.change24h / (this.currentPrice - this.change24h)) * 100
    };
});

assetSchema.virtual('volatility24h').get(function() {
    if (!this.high24h || !this.low24h) return null;
    return ((this.high24h - this.low24h) / this.low24h) * 100;
});

// Methods
assetSchema.methods.updatePrice = async function(newPrice) {
    const oldPrice = this.currentPrice;
    this.currentPrice = newPrice;
    this.change24h = newPrice - oldPrice;
    this.lastUpdated = Date.now();
    await this.save();
};

assetSchema.methods.updateStats = async function(stats) {
    Object.assign(this, stats);
    this.lastUpdated = Date.now();
    await this.save();
};

// Static methods
assetSchema.statics.getTopByMarketCap = async function(limit = 10) {
    return this.find()
        .sort({ marketCap: -1 })
        .limit(limit);
};

assetSchema.statics.getTopByVolume = async function(limit = 10) {
    return this.find()
        .sort({ volume24h: -1 })
        .limit(limit);
};

assetSchema.statics.getTopGainers = async function(limit = 10) {
    return this.find()
        .sort({ change24h: -1 })
        .limit(limit);
};

assetSchema.statics.getTopLosers = async function(limit = 10) {
    return this.find()
        .sort({ change24h: 1 })
        .limit(limit);
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
