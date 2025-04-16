const request = require('supertest');
const { getApp } = require('../setup');
const { setupTestDB } = require('../setupTestDB');
const User = require('../../models/userModel');
const logger = require('../../utils/logger');

describe('Auth Controller', () => {
    let db;
    beforeAll(async () => {
        db = await setupTestDB();
    });
    afterAll(async () => {
        await db.stop();
    });
    const createTestUser = async (userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
    }) => {
        try {
            return await User.create(userData);
        } catch (error) {
            logger.error('Error creating test user:', error);
            throw error;
        }
    };

    it('should signup a new user', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };

        const response = await request(getApp())
            .post('/api/users/signup')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.password).toBeUndefined();
    });

    it('should login a user with correct credentials', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };

        await createTestUser(userData);

        const response = await request(getApp())
            .post('/api/users/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
    });

    it('should not login with incorrect credentials', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };

        await createTestUser(userData);

        const response = await request(getApp())
            .post('/api/users/login')
            .send({
                email: userData.email,
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Invalid email or password');
    });

    describe('Protected Routes', () => {
        let token;
        let user;

        beforeEach(async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                passwordConfirm: 'password123'
            };

            user = await createTestUser(userData);
            const response = await request(getApp())
                .post('/api/users/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });
            token = response.body.token;
        });

        it('should access protected route with valid token', async () => {
            const response = await request(getApp())
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user.email).toBe(user.email);
        });

        it('should not access protected route without token', async () => {
            const response = await request(getApp())
                .get('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Not authenticated');
        });

        it('should logout a user', async () => {
            const response = await request(getApp())
                .post('/api/users/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Logged out successfully');
        });

        it('should update password with correct credentials', async () => {
            const response = await request(getApp())
                .patch('/api/users/updateMyPassword')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });

        it('should not update password with incorrect current password', async () => {
            const response = await request(getApp())
                .patch('/api/users/updateMyPassword')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Current password is incorrect');
        });
    });
});
