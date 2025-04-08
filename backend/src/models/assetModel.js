const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'An asset must have a symbol'],
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'An asset must have a name'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'An asset must have a type'],
      enum: {
        values: ['Cryptocurrency', 'Stocks', 'Commodities', 'Indices', 'Unknown'],
        message: 'Type must be either: Cryptocurrency, Stocks, Commodities, Indices, or Unknown'
      }
    },
    description: {
      type: String,
      trim: true
    },
    image: String,
    currentData: {
      priceInUSD: {
        type: Number,
        default: 0
      },
      priceInBTC: {
        type: Number,
        default: 0
      },
      marketCap: Number,
      volume24h: Number,
      change24h: Number,
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    returns: {
      ytd: Number,
      oneYear: Number,
      threeYear: Number,
      fiveYear: Number,
      max: Number
    },
    metadata: {
      coingeckoId: String,
      alphaVantageSymbol: String,
      sector: String,
      industry: String,
      country: String,
      exchange: String
    },
    popularity: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
assetSchema.index({ symbol: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ popularity: -1 });

// Virtual property for price change percentage
assetSchema.virtual('priceChangePercentage').get(function() {
  return this.currentData.change24h;
});

// Static method to find popular assets
assetSchema.statics.findPopular = function(limit = 10) {
  return this.find()
    .sort({ popularity: -1 })
    .limit(limit);
};

// Static method to find assets by type
assetSchema.statics.findByType = function(type, limit = 20) {
  return this.find({ type })
    .sort({ popularity: -1 })
    .limit(limit);
};

// Static method to search assets
assetSchema.statics.search = function(query, limit = 20) {
  return this.find({
    $or: [
      { symbol: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ]
  }).limit(limit);
};

// Instance method to update price data
assetSchema.methods.updatePriceData = function(priceData) {
  this.currentData = {
    ...this.currentData,
    ...priceData,
    lastUpdated: Date.now()
  };
  
  return this.save();
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
