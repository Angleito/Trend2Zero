const { createHash } = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), '.next/cache');
const MAX_CACHE_SIZE_MB = 500; // 500 MB cache limit
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class EnhancedCacheHandler {
  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalSize: 0
    };
    this.ensureCacheDirExists();
  }

  async ensureCacheDirExists() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
      this.logError('Failed to create cache directory', error);
    }
  }

  generateCacheKey(key) {
    return createHash('sha256').update(key).digest('hex');
  }

  logError(message, error) {
    console.error(`[Cache Error] ${message}:`, error);
    // Optional: Add more advanced logging (e.g., to a file or monitoring service)
  }

  async get(key) {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cacheFilePath = path.join(CACHE_DIR, cacheKey);
      const stats = await fs.stat(cacheFilePath);
      
      // Check cache expiration
      if (Date.now() - stats.mtime.getTime() > CACHE_EXPIRATION_MS) {
        await fs.unlink(cacheFilePath);
        this.metrics.misses++;
        return null;
      }

      const cacheData = await fs.readFile(cacheFilePath, 'utf8');
      this.metrics.hits++;
      return JSON.parse(cacheData);
    } catch (error) {
      this.metrics.misses++;
      return null;
    }
  }

  async set(key, data) {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cacheFilePath = path.join(CACHE_DIR, cacheKey);
      
      // Serialize and write cache
      const serializedData = JSON.stringify(data);
      await fs.writeFile(cacheFilePath, serializedData, 'utf8');
      
      // Update metrics
      this.metrics.sets++;
      this.metrics.totalSize += serializedData.length;

      // Manage cache size
      await this.manageCacheSize();
    } catch (error) {
      this.logError('Failed to write cache', error);
    }
  }

  async delete(key) {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cacheFilePath = path.join(CACHE_DIR, cacheKey);
      
      await fs.unlink(cacheFilePath);
      this.metrics.deletes++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logError('Failed to delete cache', error);
      }
    }
  }

  async manageCacheSize() {
    try {
      // If cache exceeds max size, remove oldest files
      const files = await fs.readdir(CACHE_DIR);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(CACHE_DIR, file);
          const stats = await fs.stat(filePath);
          return { file, mtime: stats.mtime, size: stats.size };
        })
      );

      // Sort by modification time (oldest first)
      const sortedFiles = fileStats.sort((a, b) => a.mtime - b.mtime);

      // Remove files until under size limit
      let totalSize = this.metrics.totalSize;
      for (const fileInfo of sortedFiles) {
        if (totalSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
          const filePath = path.join(CACHE_DIR, fileInfo.file);
          await fs.unlink(filePath);
          totalSize -= fileInfo.size;
        } else {
          break;
        }
      }

      this.metrics.totalSize = totalSize;
    } catch (error) {
      this.logError('Failed to manage cache size', error);
    }
  }

  // Expose metrics for monitoring
  getMetrics() {
    return {
      ...this.metrics,
      hitRatio: this.metrics.hits / (this.metrics.hits + this.metrics.misses)
    };
  }
}

module.exports = new EnhancedCacheHandler();