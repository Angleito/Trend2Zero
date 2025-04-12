import mongoose, { Document, Model, Schema, Query } from 'mongoose';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/appError';

export interface IWatchlistItem {
  symbol: string;
  type: 'crypto' | 'stock';
  addedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  watchlist: IWatchlistItem[];
  role: 'user' | 'admin';
  active: boolean;
  correctPassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  addToWatchlist(symbol: string, type: 'crypto' | 'stock'): Promise<void>;
  removeFromWatchlist(symbol: string): Promise<void>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const watchlistItemSchema = new Schema<IWatchlistItem>({
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

const userSchema = new Schema<IUser>({
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
      validator: function(value: string) {
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
      validator: function(this: IUser, el: string): boolean {
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
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = new Date(Date.now() - 1000); // Subtract 1s for token creation delay
  next();
});

// Query middleware to filter out inactive users
userSchema.pre(/^find/, function(this: Query<any, any, {}>, next) {
  this.where({ active: { $ne: false } });
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token issuance
userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to add item to watchlist
userSchema.methods.addToWatchlist = async function(
  symbol: string,
  type: 'crypto' | 'stock'
): Promise<void> {
  const exists = this.watchlist.some((item: IWatchlistItem) => item.symbol === symbol);
  if (exists) {
    throw new AppError('Asset already in watchlist', 400);
  }
  
  this.watchlist.push({ symbol, type });
  await this.save();
};

// Instance method to remove item from watchlist
userSchema.methods.removeFromWatchlist = async function(
  symbol: string
): Promise<void> {
  const index = this.watchlist.findIndex((item: IWatchlistItem) => item.symbol === symbol);
  if (index === -1) {
    throw new AppError('Asset not found in watchlist', 404);
  }
  
  this.watchlist.splice(index, 1);
  await this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string): Promise<IUser | null> {
  return this.findOne({ email });
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);