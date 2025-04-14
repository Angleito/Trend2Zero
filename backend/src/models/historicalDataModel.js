const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  price: {
    type: Number,
    required: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['Crypto', 'Stock', 'Metal', 'Index'],
    required: true
  }
}, {
  timestamps: true
});

// Define compound unique index for symbol and date
historicalDataSchema.index({ symbol: 1, date: 1 }, { unique: true });

// Optional: Index for category and date (if frequently queried together)
// historicalDataSchema.index({ category: 1, date: -1 }); 

module.exports = mongoose.model('HistoricalData', historicalDataSchema);
