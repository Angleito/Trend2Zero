const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    symbol: {
        type: String,
        required: [true, 'Order must have a symbol'],
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        required: [true, 'Order must have a type'],
        enum: ['buy', 'sell'],
        default: 'buy'
    },
    orderType: {
        type: String,
        required: [true, 'Order must have an order type'],
        enum: ['market', 'limit', 'stop'],
        default: 'market'
    },
    shares: {
        type: Number,
        required: [true, 'Order must specify number of shares'],
        min: [0.000001, 'Shares must be greater than 0']
    },
    price: {
        type: Number,
        required: [true, 'Order must have a price']
    },
    limitPrice: {
        type: Number,
        required: function() {
            return this.orderType === 'limit';
        }
    },
    stopPrice: {
        type: Number,
        required: function() {
            return this.orderType === 'stop';
        }
    },
    status: {
        type: String,
        required: [true, 'Order must have a status'],
        enum: ['pending', 'filled', 'cancelled', 'rejected', 'expired'],
        default: 'pending'
    },
    filledAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    metadata: {
        exchange: String,
        broker: String,
        fees: Number,
        notes: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ symbol: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual properties
orderSchema.virtual('totalValue').get(function() {
    return this.shares * this.price;
});

orderSchema.virtual('isActive').get(function() {
    return ['pending'].includes(this.status);
});

// Methods
orderSchema.methods.fill = async function(fillPrice) {
    this.status = 'filled';
    this.price = fillPrice;
    this.filledAt = Date.now();
    await this.save();
};

orderSchema.methods.cancel = async function(reason) {
    if (this.status !== 'pending') {
        throw new Error('Can only cancel pending orders');
    }
    this.status = 'cancelled';
    this.metadata.notes = reason;
    await this.save();
};

orderSchema.methods.reject = async function(reason) {
    if (this.status !== 'pending') {
        throw new Error('Can only reject pending orders');
    }
    this.status = 'rejected';
    this.metadata.notes = reason;
    await this.save();
};

// Static methods
orderSchema.statics.getPendingOrders = async function(userId) {
    return this.find({
        userId,
        status: 'pending'
    }).sort({ createdAt: -1 });
};

orderSchema.statics.getFilledOrders = async function(userId, limit = 50) {
    return this.find({
        userId,
        status: 'filled'
    })
        .sort({ filledAt: -1 })
        .limit(limit);
};

orderSchema.statics.getCancelledOrders = async function(userId, limit = 50) {
    return this.find({
        userId,
        status: 'cancelled'
    })
        .sort({ updatedAt: -1 })
        .limit(limit);
};

// Pre-save middleware
orderSchema.pre('save', function(next) {
    if (this.orderType === 'market') {
        this.limitPrice = undefined;
        this.stopPrice = undefined;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;