const NodeCache = require('node-cache');

/**
 * Cache utility for storing frequently accessed data
 * Uses node-cache under the hood with configurable TTL
 */
class Cache {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, // Default TTL of 5 minutes
            checkperiod: 60, // Check for expired keys every minute
            useClones: false // Store/retrieve references to objects instead of cloning
        });

        // Bind methods
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.del = this.del.bind(this);
        this.flush = this.flush.bind(this);
        this.stats = this.stats.bind(this);
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined if not found
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} [ttl] - Time to live in seconds
     * @returns {boolean} True if successful
     */
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {number} Number of deleted entries
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Delete all keys from cache
     * @returns {void}
     */
    flush() {
        this.cache.flushAll();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    stats() {
        return this.cache.getStats();
    }

    /**
     * Middleware to cache API responses
     * @param {number} [ttl] - Time to live in seconds
     * @returns {Function} Express middleware
     */
    middleware(ttl) {
        return (req, res, next) => {
            const key = `__express__${req.originalUrl || req.url}`;
            const cachedBody = this.get(key);

            if (cachedBody) {
                res.send(cachedBody);
                return;
            }

            res.sendResponse = res.send;
            res.send = (body) => {
                this.set(key, body, ttl);
                res.sendResponse(body);
            };
            next();
        };
    }

    /**
     * Get multiple values from cache
     * @param {string[]} keys - Array of cache keys
     * @returns {Object} Object with key-value pairs
     */
    mget(keys) {
        return this.cache.mget(keys);
    }

    /**
     * Set multiple values in cache
     * @param {Object} keyValuePairs - Object with key-value pairs
     * @param {number} [ttl] - Time to live in seconds
     * @returns {boolean} True if successful
     */
    mset(keyValuePairs, ttl) {
        return this.cache.mset(
            Object.entries(keyValuePairs).map(([key, value]) => ({
                key,
                val: value,
                ttl
            }))
        );
    }

    /**
     * Delete multiple values from cache
     * @param {string[]} keys - Array of cache keys
     * @returns {number} Number of deleted entries
     */
    mdel(keys) {
        return this.cache.del(keys);
    }
}

// Export singleton instance
module.exports = new Cache();
