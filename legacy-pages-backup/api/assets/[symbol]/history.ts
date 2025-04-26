import { NextApiRequest, NextApiResponse } from 'next';
import marketDataService from '../../../../lib/services/marketDataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol } = req.query;
    const days = parseInt(req.query.days as string || '7');

    try {
        const data = await marketDataService.getHistoricalData(symbol as string, days);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}