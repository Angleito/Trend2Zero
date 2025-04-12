class MockCache {
  constructor() {
    this._cache = new Map();
    this._ttlMap = new Map();
  }

  set(key, value, ttl = Infinity) {
    this._cache.set(key, value);
    if (ttl !== Infinity) {
      this._ttlMap.set(key, Date.now() + ttl);
    }
    return this;
  }

  get(key) {
    if (!this._cache.has(key)) return null;
    
    const expiration = this._ttlMap.get(key);
    if (expiration && Date.now() > expiration) {
      this.delete(key);
      return null;
    }
    
    return this._cache.get(key);
  }

  delete(key) {
    this._cache.delete(key);
    this._ttlMap.delete(key);
    return this;
  }

  clear() {
    this._cache.clear();
    this._ttlMap.clear();
    return this;
  }

  keys() {
    return Array.from(this._cache.keys()).filter(key => {
      const expiration = this._ttlMap.get(key);
      return !expiration || Date.now() <= expiration;
    });
  }

  size() {
    return this.keys().length;
  }

  has(key) {
    return this.get(key) !== null;
  }

  ttl(key) {
    const expiration = this._ttlMap.get(key);
    if (!expiration) return -1;
    
    const remainingTime = expiration - Date.now();
    return remainingTime > 0 ? remainingTime : -1;
  }
}

const mockCache = new MockCache();

module.exports = mockCache;