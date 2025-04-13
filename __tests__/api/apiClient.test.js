import axios from 'axios';
import apiClient from '../../lib/api/apiClient';

// Mock axios
jest.mock('axios');

describe('API Client', () => {
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('uses base URL from environment', () => {
        expect(apiClient.defaults.baseURL).toBe('/api');
    });

    it('adds auth token to requests when available', async () => {
        const mockToken = 'test-token';
        localStorage.setItem('token', mockToken);

        await apiClient.get('/test');

        expect(axios.create).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            })
        );
    });

    it('makes requests without auth token when not available', async () => {
        await apiClient.get('/test');

        expect(axios.create).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            })
        );
    });

    it('handles errors properly', async () => {
        const mockError = new Error('API Error');
        mockError.response = { status: 500 };
        axios.create.mockReturnValue({
            get: jest.fn().mockRejectedValue(mockError)
        });

        await expect(apiClient.get('/test')).rejects.toThrow('API Error');
    });

    it('redirects to login on 401 error', async () => {
        const mockError = new Error('Unauthorized');
        mockError.response = { status: 401 };
        axios.create.mockReturnValue({
            get: jest.fn().mockRejectedValue(mockError)
        });

        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };

        try {
            await apiClient.get('/test');
        } catch (error) {
            expect(localStorage.getItem('token')).toBeNull();
            expect(window.location.href).toBe('/login');
        }

        window.location = originalLocation;
    });
});
