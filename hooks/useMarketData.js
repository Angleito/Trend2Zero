import { useState, useEffect, useCallback } from 'react';
import * as marketDataService from '../lib/api/marketDataService';

export function useMarketData(symbol, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { refreshInterval = 0, initialFetch = true } = options;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const marketData = await marketDataService.getMarketData(symbol);
            setData(marketData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        if (initialFetch) {
            fetchData();
        }

        if (refreshInterval > 0) {
            const interval = setInterval(fetchData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, refreshInterval, initialFetch]);

    const refresh = useCallback(() => {
        return fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refresh
    };
}