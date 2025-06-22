import { create } from 'zustand';
import type { WatchlistItem } from '../hooks/useWatchlist';

interface WatchlistState {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  setWatchlist: (items: WatchlistItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: Pick<WatchlistState, 'watchlist' | 'loading' | 'error'> = {
  watchlist: [],
  loading: false,
  error: null
};

export const useWatchlistStore = create<WatchlistState>((set) => ({
  ...initialState,
  setWatchlist: (items) => set({ watchlist: items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState)
}));
