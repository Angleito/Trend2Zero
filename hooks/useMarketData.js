import { useState, useEffect, useCallback } from 'react';
import { getAssetPrice, getHistoricalData } from '../lib/api/marketDataService';

export function useMarketData(symbol, options = {}) {
    const [price, setPrice] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [priceData, historyData] = await Promise.all([
                getAssetPrice(symbol, options.type),
                getHistoricalData(symbol, options.interval || '1d')
            ]);
            setPrice(priceData);
            setHistory(historyData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [symbol, options.type, options.interval]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, options.refreshInterval || 60000);
        return () => clearInterval(interval);
    }, [fetchData, options.refreshInterval]);

    return { price, history, loading, error, refresh: fetchData };
}