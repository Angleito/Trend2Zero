const mongoose = require('mongoose');
const User = require('../../models/userModel');

describe('User Model Test', () => {
    let testUser;

    beforeEach(async () => {
        // Create a test user before each test
        testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        });
    }, 10000);

    // Test user creation
    it('should create & save user successfully', async () => {
        const userData = {
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };
        
        const validUser = new User(userData);
        const savedUser = await validUser.save();
        
        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe(userData.name);
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.password).not.toBe(userData.password);
        expect(savedUser.passwordConfirm).toBeUndefined();
    }, 10000);
    
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
    }, 10000);
    
    // Test password validation
    it('should fail when passwords do not match', async () => {
        const userData = {
            name: 'Test User',
            email: 'test2@example.com',
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
    }, 10000);
    
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
    }, 10000);
    
    // Test password hashing
    it('should hash the password before saving', async () => {
        const userData = {
            name: 'Test User',
            email: 'test3@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };
        
        const user = new User(userData);
        await user.save();
        
        expect(user.password).not.toBe(userData.password);
        
        const isMatch = await user.correctPassword('password123', user.password);
        expect(isMatch).toBe(true);
        
        const isNotMatch = await user.correctPassword('wrongpassword', user.password);
        expect(isNotMatch).toBe(false);
    }, 10000);
    
    // Test watchlist functionality
    it('should add and remove assets from watchlist', async () => {
        // Use the pre-created test user
        expect(testUser.watchlist).toBeDefined();
        expect(testUser.watchlist.length).toBe(0);
        
        // Add first asset
        await testUser.addToWatchlist('BTC', 'Cryptocurrency');
        await testUser.save();
        
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.watchlist.length).toBe(1);
        expect(updatedUser.watchlist[0].assetSymbol).toBe('BTC');
        expect(updatedUser.watchlist[0].assetType).toBe('Cryptocurrency');
        
        // Add second asset
        await updatedUser.addToWatchlist('AAPL', 'Stocks');
        await updatedUser.save();
        
        const userWithTwoAssets = await User.findById(testUser._id);
        expect(userWithTwoAssets.watchlist.length).toBe(2);
        
        // Try to add duplicate asset
        await userWithTwoAssets.addToWatchlist('BTC', 'Cryptocurrency');
        await userWithTwoAssets.save();
        
        const userWithDuplicate = await User.findById(testUser._id);
        expect(userWithDuplicate.watchlist.length).toBe(2);
        
        // Remove asset
        await userWithDuplicate.removeFromWatchlist('BTC');
        await userWithDuplicate.save();
        
        const finalUser = await User.findById(testUser._id);
        expect(finalUser.watchlist.length).toBe(1);
        expect(finalUser.watchlist[0].assetSymbol).toBe('AAPL');
    }, 10000);
});
