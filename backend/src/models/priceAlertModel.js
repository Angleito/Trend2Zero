const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Price alert must belong to a user']
    },
    symbol: {
        type: String,
        required: [true, 'Price alert must have a symbol'],
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'Price alert must have a target price']
    },
    condition: {
        type: String,
        required: [true, 'Price alert must have a condition'],
        enum: ['above', 'below'],
        default: 'above'
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    triggeredAt: {
        type: Date
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    notificationMethod: {
        type: String,
        enum: ['email', 'push', 'sms', 'all'],
        default: 'email'
    },
    repeatCount: {
        type: Number,
        default: 0
    },
    metadata: {
        type: {
            type: String,
            enum: ['stock', 'crypto', 'commodity', 'forex'],
            required: [true, 'Price alert must specify asset type']
        },
        exchange: String,
        notes: String,
        customMessage: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
priceAlertSchema.index({ userId: 1, symbol: 1, active: 1 });
priceAlertSchema.index({ symbol: 1, active: 1, price: 1 });
priceAlertSchema.index({ createdAt: -1 });

// Virtual properties
priceAlertSchema.virtual('isTriggered').get(function() {
    return Boolean(this.triggeredAt);
});

priceAlertSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Methods
priceAlertSchema.methods.trigger = async function() {
    if (!this.active) {
        throw new Error('Cannot trigger inactive alert');
    }
    this.active = false;
    this.triggeredAt = Date.now();
    await this.save();
};

priceAlertSchema.methods.reactivate = async function() {
    if (this.active) {
        throw new Error('Alert is already active');
    }
    this.active = true;
    this.triggeredAt = undefined;
    this.repeatCount += 1;
    await this.save();
};

priceAlertSchema.methods.markNotified = async function() {
    this.notificationSent = true;
    await this.save();
};

priceAlertSchema.methods.updatePrice = async function(newPrice) {
    this.price = newPrice;
    this.active = true;
    this.triggeredAt = undefined;
    await this.save();
};

// Static methods
priceAlertSchema.statics.getActiveAlerts = async function(symbol) {
    return this.find({
        symbol,
        active: true
    }).sort({ price: 1 });
};

priceAlertSchema.statics.getTriggeredAlerts = async function(userId, limit = 50) {
    return this.find({
        userId,
        triggeredAt: { $exists: true }
    })
        .sort({ triggeredAt: -1 })
        .limit(limit);
};

priceAlertSchema.statics.getAlertsByType = async function(userId, type) {
    return this.find({
        userId,
        'metadata.type': type,
        active: true
    }).sort({ createdAt: -1 });
};

priceAlertSchema.statics.cleanupOldAlerts = async function(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.deleteMany({
        active: false,
        triggeredAt: { $lt: cutoffDate }
    });
};

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);

module.exports = PriceAlert;