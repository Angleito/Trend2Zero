import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
const initialState = {
    price: 0,
    marketCap: 0,
    blockHeight: 0,
    dominance: 0,
    lastUpdated: 0
};
// Check if window is defined (client-side)
const isClient = typeof window !== 'undefined';
export const useBitcoinStore = create()(persist((set) => ({
    ...initialState,
    updateBitcoinData: (data) => set((state) => ({
        ...state,
        ...data,
        lastUpdated: Date.now()
    })),
    resetBitcoinData: () => set((state) => ({
        ...initialState,
        updateBitcoinData: state.updateBitcoinData,
        resetBitcoinData: state.resetBitcoinData
    }))
}), {
    name: 'bitcoin-storage',
    storage: isClient ? createJSONStorage(() => localStorage) : createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { }
    }))
}));
