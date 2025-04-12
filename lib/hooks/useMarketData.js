import { useState, useEffect, useMemo } from 'react';
import { 
  getPopularAssets, 
  getAssetsByType, 
  searchAssets, 
  getAssetPrice 
} from '../api/marketDataService';

export const fetchMarketData = async (type, options = {}) => {
  switch (type) {
    case 'popular':
      return await getPopularAssets(options.limit);
    case 'search':
      return await searchAssets(options.query, options.type, options.limit);
    case 'price':
      return await getAssetPrice(options.symbol);
    default:
      return await getAssetsByType(type, options.limit);
  }
};

export const useMarketData = (type, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memoizedOptions = useMemo(() => JSON.stringify(options), [options]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchMarketData(type, JSON.parse(memoizedOptions));
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [type, memoizedOptions]);

  return { data, loading, error };
};

export const usePopularAssets = () => {
  const [popularAssets, setPopularAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularAssets = async () => {
      try {
        const data = await getPopularAssets();
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
        const data = await getAssetsByType(type);
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
        const results = await searchAssets(query);
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
        const data = await getAssetPrice(symbol);
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
