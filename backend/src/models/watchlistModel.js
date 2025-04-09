const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Watchlist must belong to a user']
    },
    symbol: {
        type: String,
        required: [true, 'Watchlist must have a symbol'],
        trim: true,
        uppercase: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    alerts: [{
        condition: {
            type: String,
            enum: ['above', 'below'],
            required: [true, 'Alert must have a condition']
        },
        price: {
            type: Number,
            required: [true, 'Alert must have a price']
        },
        active: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        triggeredAt: Date
    }],
    metadata: {
        type: {
            type: String,
            enum: ['stock', 'crypto', 'commodity', 'forex'],
            required: [true, 'Watchlist item must specify asset type']
        },
        exchange: String,
        tags: [String]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });
watchlistSchema.index({ userId: 1, 'metadata.type': 1 });
watchlistSchema.index({ addedAt: -1 });

// Methods
watchlistSchema.methods.addAlert = async function(condition, price) {
    this.alerts.push({
        condition,
        price,
        active: true,
        createdAt: Date.now()
    });
    await this.save();
    return this.alerts[this.alerts.length - 1];
};

watchlistSchema.methods.removeAlert = async function(alertId) {
    this.alerts = this.alerts.filter(alert => !alert._id.equals(alertId));
    await this.save();
};

watchlistSchema.methods.triggerAlert = async function(alertId) {
    const alert = this.alerts.find(a => a._id.equals(alertId));
    if (alert) {
        alert.active = false;
        alert.triggeredAt = Date.now();
        await this.save();
    }
};

watchlistSchema.methods.addTags = async function(tags) {
    this.metadata.tags = [...new Set([...this.metadata.tags, ...tags])];
    await this.save();
};

watchlistSchema.methods.removeTags = async function(tags) {
    this.metadata.tags = this.metadata.tags.filter(tag => !tags.includes(tag));
    await this.save();
};

// Static methods
watchlistSchema.statics.getByType = async function(userId, type) {
    return this.find({
        userId,
        'metadata.type': type
    }).sort({ addedAt: -1 });
};

watchlistSchema.statics.getActiveAlerts = async function(userId) {
    return this.find({
        userId,
        'alerts.active': true
    });
};

watchlistSchema.statics.getByTags = async function(userId, tags) {
    return this.find({
        userId,
        'metadata.tags': { $in: tags }
    }).sort({ addedAt: -1 });
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;