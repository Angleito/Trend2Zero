import { NextApiRequest, NextApiResponse } from 'next';
import marketDataService from '../../../lib/services/marketDataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q: query, type } = req.query;

    try {
        // Using the marketDataService singleton instance
        const data = await marketDataService.listAvailableAssets({
            searchQuery: query as string,
            category: type as string
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}