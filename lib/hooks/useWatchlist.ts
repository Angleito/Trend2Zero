import { useState, useEffect, useCallback } from 'react';
import * as watchlistService from '../api/watchlistService';
import { useAuth } from './useAuth';

export interface WatchlistItem {
  assetSymbol: string;
  assetType: string;
  dateAdded: string;
}

interface WatchlistResponse {
  data: {
    watchlist: WatchlistItem[];
  };
}

export interface WatchlistHook {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (assetSymbol: string, assetType: string) => Promise<any>;
  removeFromWatchlist: (assetSymbol: string) => Promise<any>;
  isInWatchlist: (assetSymbol: string) => boolean;
}

export const useWatchlist = (): WatchlistHook => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await watchlistService.getWatchlist() as WatchlistResponse;
      setWatchlist(response.data.watchlist);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToWatchlist = useCallback(async (assetSymbol: string, assetType: string) => {
    try {
      setLoading(true);
      const response = await watchlistService.addToWatchlist({
        assetSymbol,
        assetType
      }) as WatchlistResponse;
      setWatchlist(response.data.watchlist);
      setError(null);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add to watchlist');
      console.error('Error adding to watchlist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const removeFromWatchlist = useCallback(async (assetSymbol: string) => {
    try {
      setLoading(true);
      const response = await watchlistService.removeFromWatchlist(assetSymbol) as WatchlistResponse;
      setWatchlist(response.data.watchlist);
      setError(null);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove from watchlist');
      console.error(`Error removing ${assetSymbol} from watchlist:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const isInWatchlist = useCallback((assetSymbol: string): boolean => {
    return watchlist.some((item: WatchlistItem) => item.assetSymbol === assetSymbol);
  }, [watchlist]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    } else {
      setWatchlist([]); // Clear watchlist if not authenticated
    }
  }, [isAuthenticated, fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };
};