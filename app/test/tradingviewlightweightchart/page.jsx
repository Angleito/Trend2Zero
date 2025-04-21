'use client';
import React, { useState, useEffect } from 'react';
import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';
export default function TradingViewLightweightChartTestPage() {
    const [errorMode, setErrorMode] = useState(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setErrorMode(params.get('error') === 'true');
    }, []);
    // Example mock data for each chart
    const btcData = [
        { time: Math.floor(new Date('2023-04-01').getTime() / 1000), value: 50000 },
        { time: Math.floor(new Date('2023-04-02').getTime() / 1000), value: 50500 },
        { time: Math.floor(new Date('2023-04-03').getTime() / 1000), value: 51000 },
        { time: Math.floor(new Date('2023-04-04').getTime() / 1000), value: 49500 },
        { time: Math.floor(new Date('2023-04-05').getTime() / 1000), value: 52000 },
    ];
    const ethData = [
        { time: Math.floor(new Date('2023-04-01').getTime() / 1000), value: 1800 },
        { time: Math.floor(new Date('2023-04-02').getTime() / 1000), value: 1850 },
        { time: Math.floor(new Date('2023-04-03').getTime() / 1000), value: 1900 },
        { time: Math.floor(new Date('2023-04-04').getTime() / 1000), value: 1750 },
        { time: Math.floor(new Date('2023-04-05').getTime() / 1000), value: 2000 },
    ];
    const aaplData = [
        { time: Math.floor(new Date('2023-04-01').getTime() / 1000), value: 170 },
        { time: Math.floor(new Date('2023-04-02').getTime() / 1000), value: 172 },
        { time: Math.floor(new Date('2023-04-03').getTime() / 1000), value: 168 },
        { time: Math.floor(new Date('2023-04-04').getTime() / 1000), value: 174 },
        { time: Math.floor(new Date('2023-04-05').getTime() / 1000), value: 176 },
    ];
    const xauData = [
        { time: Math.floor(new Date('2023-04-01').getTime() / 1000), value: 1950 },
        { time: Math.floor(new Date('2023-04-02').getTime() / 1000), value: 1960 },
        { time: Math.floor(new Date('2023-04-03').getTime() / 1000), value: 1940 },
        { time: Math.floor(new Date('2023-04-04').getTime() / 1000), value: 1975 },
        { time: Math.floor(new Date('2023-04-05').getTime() / 1000), value: 1980 },
    ];
    const errorData = []; // Empty data to simulate error/empty state
    return (<div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TradingViewLightweightChart Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {errorMode ? (<div className="border rounded p-4 bg-red-50">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Error Mode (Empty Data)</h2>
            <div className="h-64 flex items-center justify-center">
              <TradingViewLightweightChart data={errorData} width={600} height={250} key="error-test"/>
            </div>
          </div>) : (<>
            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Bitcoin (Mock Data)</h2>
              <div className="h-64">
                <TradingViewLightweightChart data={btcData} width={600} height={250} key="btc-chart"/>
              </div>
            </div>

            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Ethereum (Mock Data)</h2>
              <div className="h-64">
                <TradingViewLightweightChart data={ethData} width={600} height={250} key="eth-chart"/>
              </div>
            </div>

            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Apple (Mock Data)</h2>
              <div className="h-64">
                <TradingViewLightweightChart data={aaplData} width={600} height={250} key="aapl-chart"/>
              </div>
            </div>

            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Gold (Mock Data)</h2>
              <div className="h-64">
                <TradingViewLightweightChart data={xauData} width={600} height={250} key="xau-chart"/>
              </div>
            </div>
          </>)}
      </div>
    </div>);
}
