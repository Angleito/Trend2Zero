const mongoose = require('mongoose');
const User = require('../../models/userModel');

describe('User Model Test', () => {
  // Test user creation
  it('should create & save user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123'
    };
    
    const validUser = new User(userData);
    const savedUser = await validUser.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    
    // Password should be hashed
    expect(savedUser.password).not.toBe(userData.password);
    
    // passwordConfirm should be undefined after save
    expect(savedUser.passwordConfirm).toBeUndefined();
  });
  
  // Test required fields
  it('should fail to create user without required fields', async () => {
    const userWithoutRequiredField = new User({ name: 'Test User' });
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });
  
  // Test password validation
  it('should fail when passwords do not match', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'differentpassword'
    };
    
    const invalidUser = new User(userData);
    let err;
    
    try {
      await invalidUser.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.passwordConfirm).toBeDefined();
  });
  
  // Test email validation
  it('should fail for invalid email format', async () => {
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
      passwordConfirm: 'password123'
    };
    
    const invalidUser = new User(userData);
    let err;
    
    try {
      await invalidUser.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
  });
  
  // Test password hashing
  it('should hash the password before saving', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123'
    };
    
    const user = new User(userData);
    await user.save();
    
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
    
    // Test password comparison
    const isMatch = await user.correctPassword('password123', user.password);
    expect(isMatch).toBe(true);
    
    const isNotMatch = await user.correctPassword('wrongpassword', user.password);
    expect(isNotMatch).toBe(false);
  });
  
  // Test watchlist functionality
  it('should add and remove assets from watchlist', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123'
    };
    
    const user = new User(userData);
    await user.save();
    
    // Initially watchlist should be empty
    expect(user.watchlist.length).toBe(0);
    
    // Add asset to watchlist
    await user.addToWatchlist('BTC', 'Cryptocurrency');
    expect(user.watchlist.length).toBe(1);
    expect(user.watchlist[0].assetSymbol).toBe('BTC');
    expect(user.watchlist[0].assetType).toBe('Cryptocurrency');
    
    // Add another asset
    await user.addToWatchlist('AAPL', 'Stocks');
    expect(user.watchlist.length).toBe(2);
    
    // Try to add duplicate (should not add)
    await user.addToWatchlist('BTC', 'Cryptocurrency');
    expect(user.watchlist.length).toBe(2);
    
    // Remove asset
    await user.removeFromWatchlist('BTC');
    expect(user.watchlist.length).toBe(1);
    expect(user.watchlist[0].assetSymbol).toBe('AAPL');
  });
});
