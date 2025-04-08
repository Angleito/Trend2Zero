import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BitcoinState {
  price: number;
  marketCap: number;
  blockHeight: number;
  dominance: number;
  lastUpdated: number;

  // Actions
  updateBitcoinData: (data: Partial<Omit<BitcoinState, 'updateBitcoinData' | 'resetBitcoinData'>>) => void;
  resetBitcoinData: () => void;
}

const initialState: Omit<BitcoinState, 'updateBitcoinData' | 'resetBitcoinData'> = {
  price: 0,
  marketCap: 0,
  blockHeight: 0,
  dominance: 0,
  lastUpdated: 0
};

export const useBitcoinStore = create<BitcoinState>()(
  persist(
    (set) => ({
      ...initialState,
      
      updateBitcoinData: (data: Partial<Omit<BitcoinState, 'updateBitcoinData' | 'resetBitcoinData'>>) => 
        set((state) => ({
          ...state,
          ...data,
          lastUpdated: Date.now()
        })),
      
      resetBitcoinData: () => set((state) => ({
        ...initialState,
        updateBitcoinData: state.updateBitcoinData,
        resetBitcoinData: state.resetBitcoinData
      }))
    }),
    {
      name: 'bitcoin-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
