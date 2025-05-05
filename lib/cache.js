// WARNING: This file is server-side only. Do NOT import in client-side code or React components/hooks.
// Use API routes to access cache functionality from the client.
const clientPromise = require('./mongo');
const TTL_SECONDS = 60 * 5; // Default cache duration: 5 minutes

/**
 * Get data from cache or fetch it if not available/expired
 * @param key Cache key
 * @param fetcher Function to fetch data if not in cache
 * @param ttlSeconds Time-to-live for the cache in seconds (defaults to 5 minutes).
 * @returns The cached or freshly fetched data.
 */
async function getCachedData(key, fetcher, ttlSeconds = TTL_SECONDS) {
    try {
        const client = await clientPromise;
        const db = client.db(); // Use your default database
        const cacheCollection = db.collection('apiCache');
        const now = new Date();
        // 1. Check cache
        const cachedEntry = await cacheCollection.findOne({ key: key });
        if (cachedEntry && cachedEntry.expiresAt > now) {
            console.log(`CACHE HIT for key: ${key}`);
            return cachedEntry.data;
        }
        // 2. Cache miss or expired - Fetch fresh data
        console.log(`CACHE MISS/EXPIRED for key: ${key}. Fetching fresh data...`);
        const freshData = await fetcher();
        // 3. Update cache
        const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
        await cacheCollection.updateOne({ key: key }, {
            $set: {
                data: freshData,
                expiresAt: expiresAt,
            },
            $setOnInsert: { key: key } // Set the key only on insert
        }, { upsert: true } // Insert if not found, update if found
        );
        console.log(`CACHE UPDATED for key: ${key}`);
        return freshData;
    }
    catch (error) {
        console.error(`[Cache] Error accessing cache:`, error);
        // Fallback: Execute the fetcher directly if caching fails
        console.warn(`Falling back to direct fetch for key: ${key}`);
        return fetcher();
    }
}

module.exports = {
    getCachedData
};
