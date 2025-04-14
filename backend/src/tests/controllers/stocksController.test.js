const request = require('supertest');
const { createTestServer, getTestUrl } = require('../testUtils');

describe('Stocks Controller', () => {
    let testServer;

    beforeEach(async () => {
        if (!testServer) {
            testServer = await createTestServer();
        }
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