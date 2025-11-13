// ==========================================
// CURRENCY HELPER FOR EVENT ESCAPES
// LIVE RATES - F1 Race Locations + Major Markets
// ==========================================
// File: client/src/lib/currency.ts

import { useState, useEffect } from 'react';

export type CurrencyCode = 
  | 'USD' | 'AUD' | 'EUR' | 'GBP' | 'CAD' | 'JPY' 
  | 'SGD' | 'BHD' | 'SAR' | 'CNY' | 'HUF' | 'MXN' 
  | 'BRL' | 'QAR' | 'AED';

export const CURRENCIES = {
  // Major Markets
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', region: 'Major Markets' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', region: 'Major Markets' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', region: 'Major Markets' },
  
  // Oceania F1
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', region: 'Oceania' },
  
  // Americas F1
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', region: 'Americas' },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', region: 'Americas' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', region: 'Americas' },
  
  // Asia F1
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', region: 'Asia' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', region: 'Asia' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', region: 'Asia' },
  
  // Middle East F1
  BHD: { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', flag: '🇧🇭', region: 'Middle East' },
  SAR: { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', flag: '🇸🇦', region: 'Middle East' },
  QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', flag: '🇶🇦', region: 'Middle East' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', region: 'Middle East' },
  
  // Europe F1 (non-Euro)
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺', region: 'Europe' },
} as const;

/**
 * FALLBACK rates (used if API fails)
 * Base: 1 USD = X
 * Add 3% buffer: rate × 1.03
 */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.95,
  GBP: 0.84,
  AUD: 1.55,
  CAD: 1.39,
  MXN: 17.5,
  BRL: 5.15,
  JPY: 151.0,
  SGD: 1.35,
  CNY: 7.25,
  BHD: 0.38,
  SAR: 3.76,
  QAR: 3.65,
  AED: 3.68,
  HUF: 365.0,
};

/**
 * LIVE RATES - Cached for 4 hours
 */
interface RateCache {
  rates: Record<CurrencyCode, number>;
  lastUpdated: number;
  source: 'live' | 'fallback';
}

let rateCache: RateCache | null = null;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const FX_BUFFER = 1.03; // 3% buffer for protection (covers Stripe fees + margin)

/**
 * Fetch LIVE exchange rates from FREE API
 * API: exchangerate-api.com (free tier: 1500 requests/month)
 * Updates: Once every 4 hours = ~180 requests/month (well under limit!)
 */
async function fetchLiveRates(): Promise<Record<CurrencyCode, number>> {
  try {
    console.log('💱 Fetching live exchange rates...');
    
    // Free API - no key needed for basic tier!
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Extract only the currencies we support
    const liveRates: Record<CurrencyCode, number> = {
      USD: 1.0,
      EUR: (data.rates.EUR || FALLBACK_RATES.EUR) * FX_BUFFER,
      GBP: (data.rates.GBP || FALLBACK_RATES.GBP) * FX_BUFFER,
      AUD: (data.rates.AUD || FALLBACK_RATES.AUD) * FX_BUFFER,
      CAD: (data.rates.CAD || FALLBACK_RATES.CAD) * FX_BUFFER,
      MXN: (data.rates.MXN || FALLBACK_RATES.MXN) * FX_BUFFER,
      BRL: (data.rates.BRL || FALLBACK_RATES.BRL) * FX_BUFFER,
      JPY: (data.rates.JPY || FALLBACK_RATES.JPY) * FX_BUFFER,
      SGD: (data.rates.SGD || FALLBACK_RATES.SGD) * FX_BUFFER,
      CNY: (data.rates.CNY || FALLBACK_RATES.CNY) * FX_BUFFER,
      BHD: (data.rates.BHD || FALLBACK_RATES.BHD) * FX_BUFFER,
      SAR: (data.rates.SAR || FALLBACK_RATES.SAR) * FX_BUFFER,
      QAR: (data.rates.QAR || FALLBACK_RATES.QAR) * FX_BUFFER,
      AED: (data.rates.AED || FALLBACK_RATES.AED) * FX_BUFFER,
      HUF: (data.rates.HUF || FALLBACK_RATES.HUF) * FX_BUFFER,
    };

    console.log('✅ Live rates fetched successfully');
    console.log('📊 Sample rates:', {
      EUR: liveRates.EUR.toFixed(4),
      GBP: liveRates.GBP.toFixed(4),
      JPY: liveRates.JPY.toFixed(2),
    });

    return liveRates;
  } catch (error) {
    console.warn('⚠️ Failed to fetch live rates, using fallback:', error);
    // Add 3% buffer to fallback rates
    const bufferedFallback: Record<CurrencyCode, number> = {} as any;
    Object.keys(FALLBACK_RATES).forEach(key => {
      bufferedFallback[key as CurrencyCode] = FALLBACK_RATES[key as CurrencyCode] * FX_BUFFER;
    });
    return bufferedFallback;
  }
}

/**
 * Get exchange rates (with caching)
 */
async function getRates(): Promise<Record<CurrencyCode, number>> {
  const now = Date.now();

  // Check if cache is still valid
  if (rateCache && (now - rateCache.lastUpdated) < CACHE_DURATION) {
    console.log(`💰 Using cached rates (${rateCache.source}, age: ${Math.round((now - rateCache.lastUpdated) / 60000)} min)`);
    return rateCache.rates;
  }

  // Fetch fresh rates
  const rates = await fetchLiveRates();
  
  // Update cache
  rateCache = {
    rates,
    lastUpdated: now,
    source: 'live',
  };

  return rates;
}

/**
 * Convert between any two currencies
 */
export async function convert(
  amount: number | string,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || from === to) return num;
  
  const rates = await getRates();
  
  const inUSD = from === 'USD' ? num : num / rates[from];
  const result = to === 'USD' ? inUSD : inUSD * rates[to];
  return Math.round(result * 100) / 100;
}

/**
 * Convert synchronously (uses cached rates or fallback)
 */
export function convertSync(
  amount: number | string,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || from === to) return num;
  
  // Use cached rates if available, otherwise use fallback
  const rates = rateCache?.rates || FALLBACK_RATES;
  
  const inUSD = from === 'USD' ? num : num / rates[from];
  const result = to === 'USD' ? inUSD : inUSD * rates[to];
  return Math.round(result * 100) / 100;
}

/**
 * Format amount with currency symbol
 */
export function format(amount: number | string, currency: CurrencyCode): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return CURRENCIES[currency].symbol + '0.00';
  
  // Special formatting for JPY (no decimals)
  if (currency === 'JPY') {
    return CURRENCIES[currency].symbol + Math.round(num).toLocaleString();
  }
  
  return CURRENCIES[currency].symbol + num.toFixed(2);
}

/**
 * Detect user's currency from location
 */
export async function detectCurrency(): Promise<CurrencyCode> {
  const saved = localStorage.getItem('currency') as CurrencyCode;
  if (saved && CURRENCIES[saved]) {
    console.log('💰 Using saved currency:', saved);
    return saved;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      const countryMap: Record<string, CurrencyCode> = {
        'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'BR': 'BRL',
        'AU': 'AUD', 'NZ': 'AUD',
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
        'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR',
        'IE': 'EUR', 'FI': 'EUR', 'GR': 'EUR', 'MC': 'EUR',
        'GB': 'GBP', 'UK': 'GBP',
        'HU': 'HUF',
        'JP': 'JPY', 'SG': 'SGD', 'CN': 'CNY',
        'BH': 'BHD', 'SA': 'SAR', 'QA': 'QAR', 'AE': 'AED',
      };
      
      const detected = countryMap[data.country_code];
      if (detected) {
        console.log('💰 Detected currency:', detected, `(${data.country_code})`);
        return detected;
      }
    }
  } catch (e) {
    console.log('💰 IP detection timeout');
  }

  const locale = navigator.language || 'en-US';
  if (locale.startsWith('en-AU')) return 'AUD';
  if (locale.startsWith('en-CA')) return 'CAD';
  if (locale.startsWith('en-GB')) return 'GBP';
  if (locale.startsWith('ja')) return 'JPY';

  return 'USD';
}

export function saveCurrency(currency: CurrencyCode): void {
  localStorage.setItem('currency', currency);
}

export function getCurrenciesByRegion() {
  const regions: Record<string, typeof CURRENCIES[CurrencyCode][]> = {
    'Major Markets': [],
    'Americas': [],
    'Europe': [],
    'Asia': [],
    'Middle East': [],
    'Oceania': [],
  };

  Object.values(CURRENCIES).forEach(curr => {
    regions[curr.region].push(curr);
  });

  return regions;
}

export function getAllCurrencies() {
  return Object.values(CURRENCIES);
}

/**
 * Get current exchange rate info (for debugging)
 */
export async function getRateInfo() {
  const rates = await getRates();
  return {
    rates,
    lastUpdated: rateCache?.lastUpdated ? new Date(rateCache.lastUpdated).toISOString() : 'Never',
    source: rateCache?.source || 'none',
    cacheAge: rateCache ? Math.round((Date.now() - rateCache.lastUpdated) / 60000) : 0,
  };
}

/**
 * React Hook for Currency Management
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [loading, setLoading] = useState(true);
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    async function init() {
      // Detect currency
      const detected = await detectCurrency();
      setCurrencyState(detected);
      
      // Pre-fetch rates
      await getRates();
      setRatesReady(true);
      setLoading(false);
      
      console.log('✅ Currency system ready');
    }
    init();
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  };

  const convertToUserCurrency = async (amount: number | string, from: CurrencyCode) => {
    return await convert(amount, from, currency);
  };

  const convertToUserCurrencySync = (amount: number | string, from: CurrencyCode) => {
    return convertSync(amount, from, currency);
  };

  const formatInUserCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return format(num, currency);
  };

  return {
    currency,
    loading,
    ratesReady,
    setCurrency,
    convert: convertToUserCurrencySync, // Use sync version for UI
    convertAsync: convertToUserCurrency, // Use async if you need latest rates
    format: formatInUserCurrency,
    getAllCurrencies,
    getCurrenciesByRegion,
    getRateInfo,
  };
}