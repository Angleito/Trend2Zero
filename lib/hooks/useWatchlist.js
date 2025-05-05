/**
 * Watchlist Hooks
 * 
 * This module provides React hooks for managing the user's watchlist.
 */

import { useState, useEffect, useCallback } from 'react';
import * as watchlistService from '@/lib/api/watchlistService';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Hook for managing the user's watchlist
 * @returns {Object} - Watchlist data and functions
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch watchlist data
  const fetchWatchlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await watchlistService.getWatchlist();
      setWatchlist(response.data.watchlist);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add asset to watchlist
  const addToWatchlist = useCallback(async (assetSymbol, assetType) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to add to watchlist');
    }

    try {
      setLoading(true);
      const response = await watchlistService.addToWatchlist({
        assetSymbol,
        assetType
      });
      setWatchlist(response.data.watchlist);
      setError(null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to watchlist');
      console.error('Error adding to watchlist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Remove asset from watchlist
  const removeFromWatchlist = useCallback(async (assetSymbol) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to remove from watchlist');
    }

    try {
      setLoading(true);
      const response = await watchlistService.removeFromWatchlist(assetSymbol);
      setWatchlist(response.data.watchlist);
      setError(null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from watchlist');
      console.error(`Error removing ${assetSymbol} from watchlist:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Check if asset is in watchlist
  const isInWatchlist = useCallback((assetSymbol) => {
    if (!assetSymbol) return false;
    return watchlist.some(item => item.assetSymbol === assetSymbol);
  }, [watchlist]);

  // Fetch watchlist on mount and when user changes
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist, user]);

  return {
    watchlist,
    loading,
    error,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };
}
