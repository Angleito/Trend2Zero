const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
    assetSymbol: {
        type: String,
        required: [true, 'Historical data must have an asset symbol'],
        trim: true,
        uppercase: true
    },
    timeframe: {
        type: String,
        required: [true, 'Historical data must have a timeframe'],
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
        default: '1d'
    },
    currency: {
        type: String,
        required: [true, 'Historical data must have a currency'],
        uppercase: true,
        default: 'USD'
    },
    data: [{
        timestamp: {
            type: Date,
            required: [true, 'Data point must have a timestamp']
        },
        open: {
            type: Number,
            required: [true, 'Data point must have an open price']
        },
        high: {
            type: Number,
            required: [true, 'Data point must have a high price']
        },
        low: {
            type: Number,
            required: [true, 'Data point must have a low price']
        },
        close: {
            type: Number,
            required: [true, 'Data point must have a close price']
        },
        volume: {
            type: Number,
            default: 0
        },
        adjustedClose: Number,
        splitFactor: Number,
        dividend: Number
    }],
    metadata: {
        source: String,
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        isAdjusted: {
            type: Boolean,
            default: false
        },
        dataQuality: {
            gaps: [Date],
            suspicious: [Date],
            corrected: [Date]
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index for unique asset-timeframe-currency combination
historicalDataSchema.index(
    { assetSymbol: 1, timeframe: 1, currency: 1 },
    { unique: true }
);

// Index for efficient timestamp-based queries
historicalDataSchema.index({ 'data.timestamp': 1 });

// Virtual properties
historicalDataSchema.virtual('latestPrice').get(function() {
    if (!this.data || this.data.length === 0) return null;
    return this.data[this.data.length - 1].close;
});

historicalDataSchema.virtual('priceChange24h').get(function() {
    if (!this.data || this.data.length < 2) return null;
    const latest = this.data[this.data.length - 1].close;
    const previous = this.data[this.data.length - 2].close;
    return {
        absolute: latest - previous,
        percentage: ((latest - previous) / previous) * 100
    };
});

// Methods
historicalDataSchema.methods.addDataPoint = async function(dataPoint) {
    this.data.push(dataPoint);
    this.metadata.lastUpdated = Date.now();
    await this.save();
};

historicalDataSchema.methods.updateDataPoint = async function(timestamp, updates) {
    const point = this.data.find(p => p.timestamp.getTime() === timestamp.getTime());
    if (point) {
        Object.assign(point, updates);
        this.metadata.lastUpdated = Date.now();
        await this.save();
    }
};

historicalDataSchema.methods.removeDataPoint = async function(timestamp) {
    this.data = this.data.filter(p => p.timestamp.getTime() !== timestamp.getTime());
    this.metadata.lastUpdated = Date.now();
    await this.save();
};

// Static methods
historicalDataSchema.statics.findBySymbolAndTimeframe = async function(symbol, timeframe) {
    return this.findOne({ assetSymbol: symbol, timeframe });
};

historicalDataSchema.statics.getLatestPrices = async function(symbols) {
    const results = await this.find({
        assetSymbol: { $in: symbols },
        timeframe: '1d'
    });
    
    return results.map(doc => ({
        symbol: doc.assetSymbol,
        price: doc.latestPrice,
        change24h: doc.priceChange24h
    }));
};

const HistoricalData = mongoose.model('HistoricalData', historicalDataSchema);

module.exports = HistoricalData;
