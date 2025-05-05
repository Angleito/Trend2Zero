import { NextApiRequest, NextApiResponse } from 'next';
import marketDataService from '../../../../lib/services/marketDataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol } = req.query;
    const type = req.query.type as string || 'crypto';

    try {
        const data = await marketDataService.getAssetPrice(symbol as string);
        res.status(200).json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
    }
}