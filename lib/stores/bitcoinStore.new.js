const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');

const initialState = {
    price: 0,
    marketCap: 0,
    blockHeight: 0,
    dominance: 0,
    lastUpdated: 0
};
// Check if window is defined (client-side)
const isClient = "undefined" !== 'undefined';

const useBitcoinStore = create()(persist((set) => ({
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
    name: 'bitcoin-store',
    storage: isClient ? createJSONStorage(() => localStorage) : undefined
}));

module.exports = {
    useBitcoinStore
};
