import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_KEYS, SECURITY } from '../../../lib/config/serverConfig';
// Rate limiting configuration
const RATE_LIMIT_WINDOW = SECURITY.RATE_LIMIT.WINDOW_MS;
const MAX_REQUESTS_PER_WINDOW = SECURITY.RATE_LIMIT.MAX_REQUESTS;
// Simple in-memory rate limiting (would use Redis in production)
const ipRequestCounts = new Map();
/**
 * Rate limiting middleware
 */
function rateLimit(ip) {
    const now = Date.now();
    const record = ipRequestCounts.get(ip);
    // If no record exists or the window has expired, create a new one
    if (!record || now > record.resetTime) {
        ipRequestCounts.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
        return { limited: false };
    }
    // If within the window but exceeded max requests
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return {
            limited: true,
            message: `Rate limit exceeded. Try again after ${new Date(record.resetTime).toISOString()}`,
        };
    }
    // Increment the counter
    record.count += 1;
    ipRequestCounts.set(ip, record);
    return { limited: false };
}
/**
 * Validate the request origin to prevent CSRF
 */
function validateOrigin(request) {
    const origin = request.headers.get('origin');
    if (!origin)
        return false;
    return SECURITY.ALLOWED_ORIGINS.some(domain => origin.includes(domain) ||
        (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1'))));
}
/**
 * Sanitize and validate input parameters
 */
function validateAndSanitizeParams(params) {
    // Basic validation
    if (!params) {
        return { valid: false, error: 'No parameters provided' };
    }
    // Sanitize and validate specific parameters
    const sanitized = {};
    // Validate function parameter
    if (params.function) {
        // Only allow specific functions
        const allowedFunctions = ['SYMBOL_SEARCH', 'GLOBAL_QUOTE', 'TIME_SERIES_DAILY', 'OVERVIEW'];
        if (!allowedFunctions.includes(params.function)) {
            return { valid: false, error: 'Invalid function' };
        }
        sanitized.function = params.function;
    }
    else {
        return { valid: false, error: 'Function is required' };
    }
    // Validate symbol if provided
    if (params.symbol) {
        // Only allow alphanumeric symbols with limited special chars
        if (!/^[A-Za-z0-9.]{1,20}$/.test(params.symbol)) {
            return { valid: false, error: 'Invalid symbol format' };
        }
        sanitized.symbol = params.symbol;
    }
    // Validate keywords if provided
    if (params.keywords) {
        // Only allow alphanumeric keywords with limited special chars
        if (!/^[A-Za-z0-9 ]{1,50}$/.test(params.keywords)) {
            return { valid: false, error: 'Invalid keywords format' };
        }
        sanitized.keywords = params.keywords;
    }
    // Validate outputsize if provided
    if (params.outputsize) {
        if (!['compact', 'full'].includes(params.outputsize)) {
            return { valid: false, error: 'Invalid outputsize' };
        }
        sanitized.outputsize = params.outputsize;
    }
    return { valid: true, sanitized };
}
/**
 * Handle GET requests to the Alpha Vantage API proxy
 */
export async function GET(request) {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // Apply rate limiting
    const rateLimitResult = rateLimit(ip);
    if (rateLimitResult.limited) {
        return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
    }
    // Validate origin to prevent CSRF
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
    // Parse and validate query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const validation = validateAndSanitizeParams(params);
    if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    try {
        // Check if API key is available
        if (!API_KEYS.ALPHA_VANTAGE) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 503 });
        }
        // Prepare the Alpha Vantage API request
        const apiUrl = 'https://www.alphavantage.co/query';
        const requestParams = {
            ...validation.sanitized,
            apikey: API_KEYS.ALPHA_VANTAGE
        };
        // Make the request to Alpha Vantage
        const response = await axios.get(apiUrl, { params: requestParams });
        // Check for API errors in the response
        if (response.data && response.data.Note && response.data.Note.includes('API call frequency')) {
            return NextResponse.json({ error: 'API rate limit exceeded. Please try again later.' }, { status: 429 });
        }
        if (response.data && response.data.Error) {
            return NextResponse.json({ error: response.data.Error }, { status: 400 });
        }
        // Return the data
        return NextResponse.json(response.data);
    }
    catch (error) {
        console.error('Alpha Vantage API error:', error.message);
        // Handle different error types
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.error || 'An error occurred while fetching data from Alpha Vantage';
            // Return a sanitized error message
            return NextResponse.json({ error: message }, { status });
        }
        // Generic error handling
        return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
    }
}
