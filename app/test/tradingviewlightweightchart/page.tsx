'use client';

import React from 'react';
import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

/**
 * Test page for TradingViewLightweightChart component
 * This page is used for visual testing and browser diagnostics
 */
export default function TradingViewLightweightChartTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TradingViewLightweightChart Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Bitcoin (Dark Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart 
              symbol="BTC" 
              theme="dark" 
              days={30} 
            />
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Ethereum (Light Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart 
              symbol="ETH" 
              theme="light" 
              days={30} 
            />
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Apple (Dark Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart 
              symbol="AAPL" 
              theme="dark" 
              days={7} 
            />
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Gold (Light Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart 
              symbol="XAU" 
              theme="light" 
              days={90} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
