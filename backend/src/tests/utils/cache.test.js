const cache = require('../../utils/cache');

describe('Cache Utility', () => {
    beforeEach(() => {
        cache.clear();
    });

    describe('set and get', () => {
        it('should store and retrieve values', () => {
            cache.set('test', 'value');
            expect(cache.get('test')).toBe('value');
        });

        it('should return null for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        it('should respect TTL', async () => {
            cache.set('test', 'value', 1); // 1 second TTL
            expect(cache.get('test')).toBe('value');

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 1100));
            expect(cache.get('test')).toBeNull();
        });

        it('should use default TTL if not specified', () => {
            cache.set('test', 'value');
            expect(cache.ttl('test')).toBeGreaterThan(0);
            expect(cache.ttl('test')).toBeLessThanOrEqual(300); // default TTL is 300s
        });

        it('should handle complex objects', () => {
            const obj = { a: 1, b: { c: 2 } };
            cache.set('test', obj);
            expect(cache.get('test')).toEqual(obj);
        });
    });

    describe('delete', () => {
        it('should remove values', () => {
            cache.set('test', 'value');
            cache.delete('test');
            expect(cache.get('test')).toBeNull();
        });

        it('should handle non-existent keys', () => {
            expect(() => cache.delete('nonexistent')).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all values', () => {
            cache.set('test1', 'value1');
            cache.set('test2', 'value2');
            cache.clear();
            expect(cache.get('test1')).toBeNull();
            expect(cache.get('test2')).toBeNull();
        });
    });

    describe('keys', () => {
        it('should return all keys', () => {
            cache.set('test1', 'value1');
            cache.set('test2', 'value2');
            expect(cache.keys()).toEqual(['test1', 'test2']);
        });

        it('should return empty array when cache is empty', () => {
            expect(cache.keys()).toEqual([]);
        });
    });

    describe('size', () => {
        it('should return number of items', () => {
            expect(cache.size()).toBe(0);
            cache.set('test1', 'value1');
            cache.set('test2', 'value2');
            expect(cache.size()).toBe(2);
        });

        it('should update after deletions', () => {
            cache.set('test1', 'value1');
            cache.set('test2', 'value2');
            cache.delete('test1');
            expect(cache.size()).toBe(1);
        });
    });

    describe('has', () => {
        it('should check for existence', () => {
            cache.set('test', 'value');
            expect(cache.has('test')).toBe(true);
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should respect TTL', async () => {
            cache.set('test', 'value', 1); // 1 second TTL
            expect(cache.has('test')).toBe(true);

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 1100));
            expect(cache.has('test')).toBe(false);
        });
    });

    describe('ttl', () => {
        it('should return remaining time', () => {
            cache.set('test', 'value', 60); // 60 seconds TTL
            expect(cache.ttl('test')).toBeGreaterThan(58); // Allow for test execution time
            expect(cache.ttl('test')).toBeLessThanOrEqual(60);
        });

        it('should return -1 for non-existent keys', () => {
            expect(cache.ttl('nonexistent')).toBe(-1);
        });

        it('should return -1 for expired keys', async () => {
            cache.set('test', 'value', 1); // 1 second TTL
            await new Promise(resolve => setTimeout(resolve, 1100));
            expect(cache.ttl('test')).toBe(-1);
        });
    });

    describe('edge cases', () => {
        it('should handle undefined values', () => {
            cache.set('test', undefined);
            expect(cache.get('test')).toBeUndefined();
        });

        it('should handle null values', () => {
            cache.set('test', null);
            expect(cache.get('test')).toBeNull();
        });

        it('should handle zero TTL', () => {
            cache.set('test', 'value', 0);
            expect(cache.get('test')).toBeNull();
        });

        it('should handle negative TTL', () => {
            cache.set('test', 'value', -1);
            expect(cache.get('test')).toBeNull();
        });

        it('should handle very large TTL', () => {
            cache.set('test', 'value', Number.MAX_SAFE_INTEGER);
            expect(cache.get('test')).toBe('value');
        });
    });
});