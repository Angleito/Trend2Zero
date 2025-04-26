export interface HistoricalDataPoint {
    time: number; // timestamp
    value: number; // price
    // Additional fields that might be needed
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }
  
  export async function getHistoricalData(
    symbol: string, 
    days: number
  ): Promise<HistoricalDataPoint[]> {
    try {
      const response = await fetch(`/api/historical-data?symbol=${symbol}&days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }