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
            page: 1,
            pageSize: 20
        });
        res.status(200).json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
    }
}