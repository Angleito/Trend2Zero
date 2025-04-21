import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/appError';
const watchlistItemSchema = new Schema({
    symbol: {
        type: String,
        required: [true, 'Asset symbol is required']
    },
    type: {
        type: String,
        enum: ['crypto', 'stock'],
        required: [true, 'Asset type is required']
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function (value) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: 'Please provide a valid email'
        }
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    passwordChangedAt: Date,
    watchlist: [watchlistItemSchema],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});
// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm = undefined;
        next();
    }
    catch (error) {
        next(error);
    }
});
// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew)
        return next();
    this.passwordChangedAt = new Date(Date.now() - 1000); // Subtract 1s for token creation delay
    next();
});
// Query middleware to filter out inactive users
userSchema.pre(/^find/, function (next) {
    this.where({ active: { $ne: false } });
    next();
});
// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
// Instance method to check if password was changed after token issuance
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
// Instance method to add item to watchlist
userSchema.methods.addToWatchlist = async function (symbol, type) {
    const exists = this.watchlist.some((item) => item.symbol === symbol);
    if (exists) {
        throw new AppError('Asset already in watchlist', 400);
    }
    this.watchlist.push({ symbol, type });
    await this.save();
};
// Instance method to remove item from watchlist
userSchema.methods.removeFromWatchlist = async function (symbol) {
    const index = this.watchlist.findIndex((item) => item.symbol === symbol);
    if (index === -1) {
        throw new AppError('Asset not found in watchlist', 404);
    }
    this.watchlist.splice(index, 1);
    await this.save();
};
// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email });
};
export const User = mongoose.model('User', userSchema);
