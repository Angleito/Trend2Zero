const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/userModel');

describe('Auth Controller', () => {
  // Test user signup
  it('should signup a new user', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });
    
    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.name).toBe('Test User');
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.user.password).toBeUndefined();
  });
  
  // Test user login
  it('should login a user with correct credentials', async () => {
    // First create a user
    await User.create({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'password123',
      passwordConfirm: 'password123'
    });
    
    // Then try to login
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.name).toBe('Login Test');
    expect(response.body.data.user.email).toBe('login@example.com');
  });
  
  // Test login with incorrect credentials
  it('should not login with incorrect credentials', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('Incorrect email or password');
  });
  
  // Test protected route
  it('should access protected route with valid token', async () => {
    // First create a user and get token
    const signupResponse = await request(app)
      .post('/api/users/signup')
      .send({
        name: 'Protected Test',
        email: 'protected@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });
    
    const token = signupResponse.body.token;
    
    // Then try to access protected route
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe('protected@example.com');
  });
  
  // Test protected route without token
  it('should not access protected route without token', async () => {
    const response = await request(app).get('/api/users/me');
    
    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('You are not logged in! Please log in to get access.');
  });
  
  // Test logout
  it('should logout a user', async () => {
    const response = await request(app).get('/api/users/logout');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    
    // Check that cookie is cleared
    expect(response.headers['set-cookie'][0]).toContain('jwt=loggedout');
  });
});
