const request = require('supertest');
const { setupDatabase } = require('../setup');
const { createTestServer, closeTestServers, getTestUrl } = require('../testUtils');

describe('Stocks Controller', () => {
    let db;
    let testServer;

    beforeAll(async () => {
        db = await setupDatabase();
        testServer = await createTestServer();
    });

    beforeEach(async () => {
        await db.clearDatabase();
    });

    afterAll(async () => {
        await db.disconnect();
        await closeTestServers();
    });

    describe('GET /api/stocks', () => {
        it('should return 501 Not Implemented', async () => {
            const response = await request(getTestUrl(testServer.port, '/api/stocks'))
                .get('/')
                .expect(501);

            expect(response.body).toEqual({
                message: 'Not Implemented'
            });
        });
    });

    describe('GET /api/stocks/:symbol', () => {
        it('should return 501 Not Implemented', async () => {
            const response = await request(getTestUrl(testServer.port, '/api/stocks/AAPL'))
                .get('/')
                .expect(501);

            expect(response.body).toEqual({
                message: 'Not Implemented'
            });
        });
    });
});