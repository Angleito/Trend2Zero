import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_KEYS, SECURITY } from '../../../lib/config/serverConfig';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = SECURITY.RATE_LIMIT.WINDOW_MS;
const MAX_REQUESTS_PER_WINDOW = SECURITY.RATE_LIMIT.MAX_REQUESTS;

// Simple in-memory rate limiting (would use Redis in production)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
function rateLimit(ip: string): { limited: boolean; message?: string } {
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
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  
  return SECURITY.ALLOWED_ORIGINS.some(domain => 
    origin.includes(domain) || 
    (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
  );
}

/**
 * Sanitize and validate input parameters
 */
function validateAndSanitizeParams(params: any): { valid: boolean; sanitized?: any; error?: string } {
  // Basic validation
  if (!params) {
    return { valid: false, error: 'No parameters provided' };
  }
  
  // Sanitize and validate specific parameters
  const sanitized: any = {};
  
  // Validate endpoint
  if (params.endpoint) {
    // Only allow specific endpoints
    const allowedEndpoints = ['markets', 'coins', 'simple/price'];
    if (!allowedEndpoints.includes(params.endpoint)) {
      return { valid: false, error: 'Invalid endpoint' };
    }
    sanitized.endpoint = params.endpoint;
  } else {
    return { valid: false, error: 'Endpoint is required' };
  }
  
  // Validate coin ID if provided
  if (params.id) {
    // Only allow alphanumeric IDs with limited special chars
    if (!/^[a-z0-9-]{1,50}$/.test(params.id)) {
      return { valid: false, error: 'Invalid coin ID format' };
    }
    sanitized.id = params.id;
  }
  
  // Validate vs_currency
  if (params.vs_currency) {
    const allowedCurrencies = ['usd', 'btc', 'eth', 'eur', 'gbp', 'jpy'];
    if (!allowedCurrencies.includes(params.vs_currency.toLowerCase())) {
      return { valid: false, error: 'Invalid currency' };
    }
    sanitized.vs_currency = params.vs_currency.toLowerCase();
  }
  
  // Validate days parameter
  if (params.days) {
    const days = parseInt(params.days);
    if (isNaN(days) || days < 1 || days > 365) {
      return { valid: false, error: 'Invalid days parameter' };
    }
    sanitized.days = days;
  }
  
  // Validate page and per_page
  if (params.page) {
    const page = parseInt(params.page);
    if (isNaN(page) || page < 1 || page > 100) {
      return { valid: false, error: 'Invalid page number' };
    }
    sanitized.page = page;
  }
  
  if (params.per_page) {
    const perPage = parseInt(params.per_page);
    if (isNaN(perPage) || perPage < 1 || perPage > 250) {
      return { valid: false, error: 'Invalid per_page value' };
    }
    sanitized.per_page = perPage;
  }
  
  return { valid: true, sanitized };
}

/**
 * Handle GET requests to the CoinGecko API proxy
 */
export async function GET(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Apply rate limiting
  const rateLimitResult = rateLimit(ip);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      { status: 429 }
    );
  }
  
  // Validate origin to prevent CSRF
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }
  
  // Parse and validate query parameters
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const validation = validateAndSanitizeParams(params);
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  try {
    // Prepare the CoinGecko API request
    const { endpoint, ...restParams } = validation.sanitized;
    const apiUrl = `https://api.coingecko.com/api/v3/${endpoint}`;
    
    // Add API key if available
    const requestParams = { ...restParams };
    if (API_KEYS.COIN_GECKO) {
      requestParams.x_cg_pro_api_key = API_KEYS.COIN_GECKO;
    }
    
    // Make the request to CoinGecko
    const response = await axios.get(apiUrl, { params: requestParams });
    
    // Return the data
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('CoinGecko API error:', error.message);
    
    // Handle different error types
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'An error occurred while fetching data from CoinGecko';
      
      // Return a sanitized error message
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    // Generic error handling
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
