class Cache {
    constructor() {
        this.cache = new Map();
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

    set(key, value, ttlSeconds) {
        if (value === undefined || value === null) {
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
