'use client';
import { useRef, useEffect, useState } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle, LineSeries } from 'lightweight-charts';
// Helper function to convert time to proper format
const formatTime = (timestamp) => {
    // If it's already a valid Time type (ISO string), return it
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    // Check if it's a BusinessDay object
    if (timestamp !== null && typeof timestamp === 'object' && 'year' in timestamp) {
        return timestamp;
    }
    // Convert numeric timestamp to UTCTimestamp
    return Math.floor(Number(timestamp) / 1000);
};
const TradingViewLightweightChart = ({ data, symbol, theme = 'dark', days = 30, width = 600, height = 300, }) => {
    const chartContainerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [formattedData, setFormattedData] = useState([]);
    const [debugInfo, setDebugInfo] = useState({});
    const [chart, setChart] = useState(null);
    const [lineSeries, setLineSeries] = useState(null);
    // Generate data based on symbol or use provided data
    useEffect(() => {
        const generateData = () => {
            try {
                setIsLoading(true);
                setIsError(false);
                // If data is provided directly, use it
                if (data && data.length > 0) {
                    console.log(`[Chart] Using provided data with ${data.length} points`);
                    const formattedProviderData = data.map(point => ({
                        time: formatTime(point.time),
                        value: point.value
                    }));
                    setFormattedData(formattedProviderData);
                    setIsLoading(false);
                    return;
                }
                // Generate sample data based on symbol
                if (symbol) {
                    console.log(`[Chart] Generating data for symbol: ${symbol}, days: ${days}`);
                    const generatedData = [];
                    const today = new Date();
                    let basePrice = 100;
                    // Set base price based on symbol
                    if (symbol === 'BTC')
                        basePrice = 60000;
                    else if (symbol === 'ETH')
                        basePrice = 3000;
                    else if (symbol === 'AAPL')
                        basePrice = 180;
                    else if (symbol === 'GOOGL')
                        basePrice = 125;
                    else if (symbol === 'XAU')
                        basePrice = 2000;
                    // Generate data points
                    for (let i = days; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - i);
                        // Add some random variation
                        const randomFactor = 0.98 + Math.random() * 0.04; // Between 0.98 and 1.02
                        const price = basePrice * randomFactor;
                        generatedData.push({
                            time: date.getTime(),
                            value: price
                        });
                        // Update base price for next day
                        basePrice = price;
                    }
                    console.log(`[Chart] Generated ${generatedData.length} data points`);
                    const formatted = generatedData.map(point => ({
                        time: formatTime(point.time),
                        value: point.value
                    }));
                    setFormattedData(formatted);
                    setIsLoading(false);
                }
                else {
                    // No data and no symbol provided
                    console.error('[Chart] No data or symbol provided');
                    setIsError(true);
                    setIsLoading(false);
                }
            }
            catch (error) {
                console.error('[Chart] Error generating chart data:', error);
                setIsError(true);
                setIsLoading(false);
            }
        };
        generateData();
    }, [data, symbol, days]);
    // Create chart instance once
    useEffect(() => {
        if (!chartContainerRef.current || chart !== null || isError) {
            return;
        }
        console.log('[Chart] Creating chart...');
        try {
            // Create chart with explicit dimensions
            const newChart = createChart(chartContainerRef.current, {
                width: width,
                height: height,
                layout: {
                    background: {
                        type: ColorType.Solid,
                        color: theme === 'dark' ? '#1E1E2D' : '#FFFFFF'
                    },
                    textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
                },
                grid: {
                    vertLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
                    horzLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
                },
                timeScale: {
                    borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
                    timeVisible: true,
                    secondsVisible: false,
                },
                rightPriceScale: {
                    borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
                    visible: true,
                },
                crosshair: {
                    mode: CrosshairMode.Normal,
                    vertLine: {
                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        width: 1,
                        style: LineStyle.Dashed,
                    },
                    horzLine: {
                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        width: 1,
                        style: LineStyle.Dashed,
                    },
                },
            });
            // Add line series
            const newLineSeries = newChart.addSeries(LineSeries, {
                color: '#FF9500',
                lineWidth: 2,
                priceLineVisible: true,
                lastValueVisible: true,
                crosshairMarkerVisible: true,
            });
            console.log('[Chart] Chart and series created');
            // Store chart and series in state
            setChart(newChart);
            setLineSeries(newLineSeries);
            // Debug info
            const debugData = {
                containerExists: true,
                containerDimensions: {
                    clientWidth: chartContainerRef.current.clientWidth,
                    clientHeight: chartContainerRef.current.clientHeight,
                    offsetWidth: chartContainerRef.current.offsetWidth,
                    offsetHeight: chartContainerRef.current.offsetHeight
                },
                chartCreated: true,
                theme,
                width,
                height,
                timestamp: new Date().toISOString()
            };
            setDebugInfo(debugData);
            // Handle resize
            const handleResize = () => {
                if (chartContainerRef.current) {
                    newChart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight
                    });
                    newChart.timeScale().fitContent();
                }
            };
            // Add resize listener
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', handleResize);
            }
            // Return cleanup function
            return () => {
                console.log('[Chart] Cleaning up chart');
                if (typeof window !== 'undefined') {
                    window.removeEventListener('resize', handleResize);
                }
                newChart.remove();
                setChart(null);
                setLineSeries(null);
            };
        }
        catch (error) {
            console.error('[Chart] Error creating chart:', error);
            setIsError(true);
            return undefined;
        }
    }, [chartContainerRef.current, chart, isError, width, height, theme]);
    // Update chart data when formattedData changes
    useEffect(() => {
        if (!lineSeries || isLoading || isError) {
            return;
        }
        try {
            if (formattedData.length > 0) {
                console.log(`[Chart] Setting data with ${formattedData.length} points`);
                lineSeries.setData(formattedData);
            }
            else {
                // Fallback data if chartData is empty
                console.log('[Chart] Using fallback data');
                const now = Date.now();
                lineSeries.setData([
                    { time: formatTime(now - 86400000), value: 100 },
                    { time: formatTime(now), value: 110 },
                ]);
            }
            // Fit content
            if (chart) {
                chart.timeScale().fitContent();
                console.log('[Chart] Fitted content');
            }
        }
        catch (error) {
            console.error('[Chart] Error updating chart data:', error);
            setIsError(true);
        }
    }, [formattedData, lineSeries, chart, isLoading, isError]);
    // Handle retry
    const handleRetry = () => {
        console.log('[Chart] Retry clicked');
        setIsLoading(true);
        setIsError(false);
        // This will trigger the data generation effect
        setFormattedData([]);
    };
    // Loading state
    if (isLoading) {
        return (<div data-testid="chart-loading" className="flex items-center justify-center" style={{ width, height, background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF9500]"></div>
      </div>);
    }
    // Error state
    if (isError) {
        return (<div data-testid="chart-error" className="flex items-center justify-center" style={{ width, height, background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' }}>
        <div className="text-center">
          <p data-testid="error-message" className="text-red-500 mb-2">
            Failed to load chart data
          </p>
          <button data-testid="retry-button" className="px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors" onClick={handleRetry}>
            Retry
          </button>
          <div className="text-xs text-gray-500 mt-2">
            Debug: {JSON.stringify(debugInfo).substring(0, 100)}...
          </div>
        </div>
      </div>);
    }
    // Chart container
    return (<div ref={chartContainerRef} data-testid="chart-container" className="chart-container" style={{
            width,
            height,
            position: 'relative',
            overflow: 'hidden'
        }}/>);
};
export default TradingViewLightweightChart;
