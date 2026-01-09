import { useState, useEffect, useCallback } from 'react';
import { apiService, MarketData, ArbitrageOpportunity } from '@/services/ApiService';

// Coinbase API endpoints
const COINBASE_APT_API = 'https://api.coinbase.com/v2/prices/APT-USD/spot';
const COINBASE_USDC_API = 'https://api.coinbase.com/v2/prices/USDC-USD/spot';
const COINBASE_USDT_API = 'https://api.coinbase.com/v2/prices/USDT-USD/spot';

export interface TokenPrice {
  symbol: string;
  price: string;
  priceNum: number;
  change: string;
  marketCap: string;
  volume24h: string;
}

export interface UseMarketDataReturn {
  marketData: MarketData | null;
  tokenPrices: Record<string, TokenPrice>;
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshMarketData: () => Promise<void>;
  refreshOpportunities: () => Promise<void>;
}

export const useMarketData = (refreshInterval: number = 5000): UseMarketDataReturn => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Record<string, TokenPrice>>({});
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch live prices from Coinbase API
      let aptPrice = 0;
      let usdcPrice = 1;
      let usdtPrice = 1;
      
      try {
        const [aptResponse, usdcResponse, usdtResponse] = await Promise.all([
          fetch(COINBASE_APT_API),
          fetch(COINBASE_USDC_API),
          fetch(COINBASE_USDT_API)
        ]);
        
        if (aptResponse.ok) {
          const aptData = await aptResponse.json();
          aptPrice = parseFloat(aptData.data?.amount) || 0;
        }
        
        if (usdcResponse.ok) {
          const usdcData = await usdcResponse.json();
          usdcPrice = parseFloat(usdcData.data?.amount) || 1;
        }
        
        if (usdtResponse.ok) {
          const usdtData = await usdtResponse.json();
          usdtPrice = parseFloat(usdtData.data?.amount) || 1;
        }
      } catch (e) {
        console.warn('Coinbase fetch failed:', e);
      }
      
      // Fetch additional market data from arbitrage API
      const marketResponse = await apiService.getMarketOverview();
      
      if (marketResponse.success && marketResponse.data) {
        setMarketData(marketResponse.data);
      }
      
      // Build token prices with live Coinbase data
      const prices: Record<string, TokenPrice> = {
        APT: {
          symbol: 'APT',
          price: `$${aptPrice.toFixed(2)}`,
          priceNum: aptPrice,
          change: '+0.0%',
          marketCap: marketResponse.data?.chains.find(c => c.chain === 'apt')?.market_cap || 'N/A',
          volume24h: marketResponse.data?.chains.find(c => c.chain === 'apt')?.volume_24h || 'N/A'
        },
        USDC: {
          symbol: 'USDC',
          price: `$${usdcPrice.toFixed(4)}`,
          priceNum: usdcPrice,
          change: '+0.0%',
          marketCap: 'N/A',
          volume24h: 'N/A'
        },
        USDT: {
          symbol: 'USDT',
          price: `$${usdtPrice.toFixed(4)}`,
          priceNum: usdtPrice,
          change: '+0.0%',
          marketCap: 'N/A',
          volume24h: 'N/A'
        }
      };
      
      setTokenPrices(prices);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Market data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await apiService.findArbitrageOpportunities({
        trade_amount: 1000,
        dex_fees: { 'Smart Contract': 0.30 }
      });
      
      if (response.success && response.data?.opportunities?.top_opportunities) {
        setOpportunities(response.data.opportunities.top_opportunities);
      }
    } catch (err) {
      console.error('Opportunities fetch error:', err);
    }
  }, []);

  const refreshMarketData = useCallback(async () => {
    setIsLoading(true);
    await fetchMarketData();
  }, [fetchMarketData]);

  const refreshOpportunities = useCallback(async () => {
    setIsLoading(true);
    await fetchOpportunities();
    setIsLoading(false);
  }, [fetchOpportunities]);

  useEffect(() => {
    fetchMarketData();
    fetchOpportunities();
  }, [fetchMarketData, fetchOpportunities]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMarketData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarketData, refreshInterval]);

  return {
    marketData,
    tokenPrices,
    opportunities,
    isLoading,
    error,
    lastUpdated,
    refreshMarketData,
    refreshOpportunities
  };
};