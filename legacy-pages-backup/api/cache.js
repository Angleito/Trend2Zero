// This API route exposes server-only cache functionality to the client safely.
// Do NOT import server-only modules (like `mongodb` or `./mongo`) in client code!
import { getCachedData } from '../../lib/cache';
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { key } = req.query;
    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid key parameter' });
    }
    try {
        // For demo: you might want to customize the fetcher logic per key
        const data = await getCachedData(key, async () => {
            // Replace with your actual data-fetching logic!
            return { message: `Fresh data for key: ${key}` };
        });
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}
