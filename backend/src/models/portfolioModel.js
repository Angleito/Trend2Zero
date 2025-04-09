const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Portfolio must belong to a user']
    },
    symbol: {
        type: String,
        required: [true, 'Portfolio must have a symbol'],
        trim: true,
        uppercase: true
    },
    shares: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    averagePrice: {
        type: Number,
        required: [true, 'Portfolio must have an average price']
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: {
            type: String,
            enum: ['stock', 'crypto'],
            required: [true, 'Portfolio must specify asset type']
        },
        notes: String,
        tags: [String]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });
portfolioSchema.index({ userId: 1, 'metadata.type': 1 });

// Virtual properties
portfolioSchema.virtual('totalValue').get(function() {
    if (this.metadata.type === 'stock') {
        return this.shares * this.averagePrice;
    }
    return this.amount * this.averagePrice;
});

// Methods
portfolioSchema.methods.updatePosition = async function(quantity, price, isStock = true) {
    const field = isStock ? 'shares' : 'amount';
    const oldTotal = this[field] * this.averagePrice;
    const newQuantity = quantity;
    const newTotal = oldTotal + (newQuantity * price);
    
    this[field] += newQuantity;
    this.averagePrice = newTotal / this[field];
    this.lastUpdated = Date.now();
    
    await this.save();
};

portfolioSchema.methods.addTags = async function(tags) {
    this.metadata.tags = [...new Set([...this.metadata.tags, ...tags])];
    await this.save();
};

portfolioSchema.methods.removeTags = async function(tags) {
    this.metadata.tags = this.metadata.tags.filter(tag => !tags.includes(tag));
    await this.save();
};

// Static methods
portfolioSchema.statics.getTotalValue = async function(userId, type) {
    const positions = await this.find({
        userId,
        'metadata.type': type
    });
    
    return positions.reduce((total, position) => {
        return total + position.totalValue;
    }, 0);
};

portfolioSchema.statics.getPositionsByType = async function(userId, type) {
    return this.find({
        userId,
        'metadata.type': type
    }).sort({ totalValue: -1 });
};

portfolioSchema.statics.getTopPositions = async function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ totalValue: -1 })
        .limit(limit);
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;