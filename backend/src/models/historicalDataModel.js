const mongoose = require('mongoose');

const historicalDataPointSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    priceInBTC: {
      type: Number
    },
    open: Number,
    high: Number,
    low: Number,
    volume: Number
  },
  { _id: false }
);

const historicalDataSchema = new mongoose.Schema(
  {
    assetSymbol: {
      type: String,
      required: [true, 'Historical data must be linked to an asset symbol'],
      trim: true,
      uppercase: true
    },
    timeframe: {
      type: String,
      required: [true, 'Historical data must have a timeframe'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: 'Timeframe must be either: daily, weekly, monthly, or yearly'
      }
    },
    currency: {
      type: String,
      required: [true, 'Historical data must have a currency'],
      enum: {
        values: ['USD', 'BTC'],
        message: 'Currency must be either: USD or BTC'
      },
      default: 'USD'
    },
    dataPoints: [historicalDataPointSchema],
    startDate: {
      type: Date,
      required: [true, 'Historical data must have a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Historical data must have an end date']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for faster queries
historicalDataSchema.index({ assetSymbol: 1, timeframe: 1, currency: 1 });

// Static method to find historical data for an asset
historicalDataSchema.statics.findForAsset = function(assetSymbol, timeframe = 'daily', currency = 'USD') {
  return this.findOne({
    assetSymbol,
    timeframe,
    currency
  });
};

// Static method to find or create historical data
historicalDataSchema.statics.findOrCreate = async function(assetSymbol, timeframe = 'daily', currency = 'USD') {
  let historicalData = await this.findOne({
    assetSymbol,
    timeframe,
    currency
  });
  
  if (!historicalData) {
    historicalData = await this.create({
      assetSymbol,
      timeframe,
      currency,
      dataPoints: [],
      startDate: new Date(),
      endDate: new Date()
    });
  }
  
  return historicalData;
};

// Instance method to update data points
historicalDataSchema.methods.updateDataPoints = function(newDataPoints) {
  // Merge new data points with existing ones
  const existingDates = new Set(this.dataPoints.map(dp => dp.date.toISOString().split('T')[0]));
  
  // Add new data points that don't exist yet
  newDataPoints.forEach(newPoint => {
    const dateStr = new Date(newPoint.date).toISOString().split('T')[0];
    if (!existingDates.has(dateStr)) {
      this.dataPoints.push(newPoint);
    }
  });
  
  // Sort data points by date
  this.dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Update start and end dates
  if (this.dataPoints.length > 0) {
    this.startDate = this.dataPoints[0].date;
    this.endDate = this.dataPoints[this.dataPoints.length - 1].date;
  }
  
  this.lastUpdated = Date.now();
  
  return this.save();
};

// Instance method to get data points for a specific date range
historicalDataSchema.methods.getDataPointsInRange = function(startDate, endDate) {
  return this.dataPoints.filter(point => {
    const pointDate = new Date(point.date);
    return pointDate >= startDate && pointDate <= endDate;
  });
};

const HistoricalData = mongoose.model('HistoricalData', historicalDataSchema);

module.exports = HistoricalData;
