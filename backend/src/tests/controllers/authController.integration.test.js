const request = require('supertest');
const { getApp } = require('../setup');
const { createTestUser, clearTestData } = require('../helpers/testDb');
const User = require('../../models/userModel');

describe('Auth Controller Integration Tests', () => {
    beforeEach(async () => {
        await clearTestData();
    });

    describe('POST /api/users/signup', () => {
        it('should create a new user and return a token', async () => {
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

        it('should return 400 if passwords do not match', async () => {
            const response = await request(getApp())
                .post('/api/users/signup')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    passwordConfirm: 'different123'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Passwords do not match');
        });

        it('should return 400 if email is already in use', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                passwordConfirm: 'password123'
            };

            await createTestUser(userData);

            const response = await request(getApp())
                .post('/api/users/signup')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Email already exists');
        });
    });

    describe('POST /api/users/login', () => {
        it('should login user and return a token', async () => {
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

        it('should return 401 if email is incorrect', async () => {
            const response = await request(getApp())
                .post('/api/users/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should return 401 if password is incorrect', async () => {
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

        it('should return current user when authenticated', async () => {
            const response = await request(getApp())
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user.email).toBe(user.email);
        });

        it('should return 401 when not authenticated', async () => {
            const response = await request(getApp())
                .get('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Not authenticated');
        });

        it('should update password when current password is correct', async () => {
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

        it('should return 401 when current password is incorrect', async () => {
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
