const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Transaction must belong to a user']
    },
    symbol: {
        type: String,
        required: [true, 'Transaction must have a symbol'],
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        required: [true, 'Transaction must have a type'],
        enum: ['buy', 'sell', 'transfer_in', 'transfer_out'],
        default: 'buy'
    },
    amount: {
        type: Number,
        required: [true, 'Transaction must specify amount'],
        min: [0.000001, 'Amount must be greater than 0']
    },
    price: {
        type: Number,
        required: [true, 'Transaction must have a price']
    },
    fee: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: [true, 'Transaction must have a status'],
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    metadata: {
        exchange: String,
        wallet: String,
        txHash: String,
        network: String,
        notes: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ symbol: 1, timestamp: -1 });
transactionSchema.index({ 'metadata.txHash': 1 }, { sparse: true });

// Virtual properties
transactionSchema.virtual('totalValue').get(function() {
    return this.amount * this.price;
});

transactionSchema.virtual('totalWithFees').get(function() {
    return this.totalValue + this.fee;
});

// Methods
transactionSchema.methods.complete = async function() {
    if (this.status !== 'pending') {
        throw new Error('Can only complete pending transactions');
    }
    this.status = 'completed';
    await this.save();
};

transactionSchema.methods.fail = async function(reason) {
    if (this.status !== 'pending') {
        throw new Error('Can only fail pending transactions');
    }
    this.status = 'failed';
    this.metadata.notes = reason;
    await this.save();
};

transactionSchema.methods.addMetadata = async function(metadata) {
    Object.assign(this.metadata, metadata);
    await this.save();
};

// Static methods
transactionSchema.statics.getTransactionsBySymbol = async function(userId, symbol, limit = 50) {
    return this.find({
        userId,
        symbol,
        status: 'completed'
    })
        .sort({ timestamp: -1 })
        .limit(limit);
};

transactionSchema.statics.getRecentTransactions = async function(userId, limit = 50) {
    return this.find({
        userId,
        status: 'completed'
    })
        .sort({ timestamp: -1 })
        .limit(limit);
};

transactionSchema.statics.getPendingTransactions = async function(userId) {
    return this.find({
        userId,
        status: 'pending'
    }).sort({ timestamp: -1 });
};

transactionSchema.statics.getTransactionVolume = async function(userId, timeframe) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                status: 'completed',
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$symbol',
                volume: { $sum: '$totalValue' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { volume: -1 }
        }
    ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;