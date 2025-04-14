class Cache {
    constructor() {
        this.cache = new Map();
        this.DEFAULT_TTL = 300; // 5 minutes
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    set(key, value, ttlSeconds = this.DEFAULT_TTL) {
        // Handle undefined and null values
        if (value === undefined) {
            return;
        }

        // Handle zero or negative TTL
        if (ttlSeconds <= 0) {
            return;
        }
        
        const item = {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        };
        
        this.cache.set(key, item);
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    // Check if a key exists and is not expired
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    // Get remaining time for a key
    ttl(key) {
        const item = this.cache.get(key);
        if (!item) return -1;
        
        const remainingTime = Math.max(0, item.expiry - Date.now()) / 1000;
        return remainingTime > 0 ? remainingTime : -1;
    }

    // Get all valid keys
    keys() {
        this.cleanup(); // Remove expired items first
        return Array.from(this.cache.keys());
    }

    // Get number of valid items
    size() {
        this.cleanup(); // Remove expired items first
        return this.cache.size;
    }

    // Remove expired items
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

module.exports = new Cache();
