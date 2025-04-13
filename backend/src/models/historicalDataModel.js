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
  timestamps: true,
  indexes: [
    { fields: { symbol: 1, date: -1 } },
    { fields: { category: 1, date: -1 } }
  ]
});

module.exports = mongoose.model('HistoricalData', historicalDataSchema);
