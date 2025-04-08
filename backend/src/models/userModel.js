const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in query results by default
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords do not match'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    watchlist: [{
      assetSymbol: String,
      assetType: {
        type: String,
        enum: ['Cryptocurrency', 'Stocks', 'Commodities', 'Indices']
      },
      dateAdded: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Middleware to update passwordChangedAt when password is changed
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Subtract 1 second to ensure token is created after password change
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware to filter out inactive users
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// Instance method to check if password is correct
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user changed password after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Instance method to add asset to watchlist
userSchema.methods.addToWatchlist = function(assetSymbol, assetType) {
  // Check if asset already exists in watchlist
  const exists = this.watchlist.some(item => item.assetSymbol === assetSymbol);
  
  if (!exists) {
    this.watchlist.push({ assetSymbol, assetType });
  }
  
  return this.save();
};

// Instance method to remove asset from watchlist
userSchema.methods.removeFromWatchlist = function(assetSymbol) {
  this.watchlist = this.watchlist.filter(
    item => item.assetSymbol !== assetSymbol
  );
  
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
