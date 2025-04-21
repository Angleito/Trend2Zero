import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOL = 'AAPL';
const URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&apikey=${API_KEY}`;
async function testAlphaVantage() {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Alpha Vantage API response:', JSON.stringify(data, null, 2));
        if (data['Error Message'] || data['Note']) {
            console.error('Alpha Vantage API returned an error or note:', data['Error Message'] || data['Note']);
            process.exit(1);
        }
        if (data['Time Series (Daily)']) {
            const firstDate = Object.keys(data['Time Series (Daily)'])[0];
            const firstData = data['Time Series (Daily)'][firstDate];
            console.log(`Sample data for ${SYMBOL} on ${firstDate}:`, firstData);
        }
        else {
            console.error('Unexpected response structure:', data);
            process.exit(1);
        }
    }
    catch (err) {
        console.error('Error fetching Alpha Vantage data:', err);
        process.exit(1);
    }
}
testAlphaVantage();
