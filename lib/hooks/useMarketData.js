import { useState, useEffect, useCallback } from 'react';
import MarketDataService from '../services/marketDataService.ts';

const marketService = new MarketDataService();

export function useMarketData(symbol) {
    const [state, setState] = useState({
        price: null,
        historicalData: null,
        popularAssets: [],
        searchResults: [],
        loading: false,
        error: null
    });

    const fetchData = useCallback(async () => {
        if (!symbol) {
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const [price, historicalData] = await Promise.all([
                marketService.getAssetPriceInBTC(symbol),
                marketService.getHistoricalData(symbol, 30)
            ]);

            setState(prev => ({
                ...prev,
                price,
                historicalData,
                loading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to fetch market data',
                loading: false
            }));
        }
    }, [symbol]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...state,
        refetch
    };
}

export const fetchMarketData = async (type, options = {}) => {
    switch (type) {
        case 'popular':
            return await marketService.listAvailableAssets({ pageSize: options.limit });
        case 'search':
            return await marketService.listAvailableAssets({ 
                keywords: options.query, 
                category: options.type, 
                pageSize: options.limit 
            });
        case 'price':
            return await marketService.getAssetPriceInBTC(options.symbol);
        default:
            return await marketService.listAvailableAssets({ 
                category: type, 
                pageSize: options.limit 
            });
    }
};

export const usePopularAssets = () => {
    const [popularAssets, setPopularAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPopularAssets = async () => {
            try {
                const data = await marketService.listAvailableAssets({ pageSize: 10 });
                setPopularAssets(data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch popular assets', error);
                setLoading(false);
            }
        };

        loadPopularAssets();
    }, []);

    return { popularAssets, loading };
};

export const useAssetsByType = (type) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const data = await marketService.listAvailableAssets({ category: type });
                setAssets(data);
                setLoading(false);
            } catch (error) {
                console.error(`Failed to fetch ${type} assets`, error);
                setLoading(false);
            }
        };

        loadAssets();
    }, [type]);

    return { assets, loading };
};

export const useAssetSearch = (query) => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchAssetsEffect = async () => {
            if (!query) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const results = await marketService.listAvailableAssets({ keywords: query });
                setSearchResults(results);
                setLoading(false);
            } catch (error) {
                console.error('Failed to search assets', error);
                setLoading(false);
            }
        };

        searchAssetsEffect();
    }, [query]);

    return { searchResults, loading };
};

export const useAssetPrice = (symbol) => {
    const [price, setPrice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const data = await marketService.getAssetPriceInBTC(symbol);
                setPrice(data);
                setLoading(false);
            } catch (error) {
                console.error(`Failed to fetch price for ${symbol}`, error);
                setLoading(false);
            }
        };

        fetchPrice();
    }, [symbol]);

    return { price, loading };
};
