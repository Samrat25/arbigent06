# Aptos Arbitrage API Routes

## Base URL
```
http://localhost:8000
```

## API Overview
This API provides arbitrage analysis for Aptos ecosystem tokens (APT, USDC, USDT) with live market data integration and intelligent agent-based calculations.

---

## 1. GET `/` - API Root

### Input
None (GET request)

### Output
```json
{
  "name": "Aptos Arbitrage API",
  "version": "7.0.0",
  "ecosystem": "aptos",
  "supported_tokens": ["APT", "USDC", "USDT"],
  "endpoints": [
    "GET /market/overview",
    "POST /arbitrage/getcharges",
    "POST /arbitrage/isprofitable", 
    "POST /arbitrage/possibilities",
    "POST /arbitrage/optimize-investment"
  ],
  "behavior": "Always fetches live data first (up to 5000ms), returns stored value on timeout",
  "ai_agent": "LangChain-powered",
  "langchain_enabled": true
}
```

---

## 2. GET `/market/overview` - Live Market Data

### Input
None (GET request)

### Output
```json
{
  "status": "success",
  "timestamp": "2026-01-08T08:40:50.756240Z",
  "base_currency": "usd",
  "chains": [
    {
      "chain": "apt",
      "current_price": "12.45",
      "gas_fees": "0.001",
      "tvl_usd": "850,000,000",
      "market_cap": "$5,200,000,000",
      "fully_diluted_valuation": "$5,200,000,000",
      "volume_24h": "$180,000,000"
    },
    {
      "chain": "usdc",
      "current_price": "1.00",
      "gas_fees": "0.001",
      "tvl_usd": "850,000,000",
      "market_cap": "$25,000,000,000",
      "fully_diluted_valuation": "$25,000,000,000",
      "volume_24h": "$2,800,000,000"
    },
    {
      "chain": "usdt",
      "current_price": "0.999",
      "gas_fees": "0.001",
      "tvl_usd": "850,000,000",
      "market_cap": "$95,000,000,000",
      "fully_diluted_valuation": "$95,000,000,000",
      "volume_24h": "$15,000,000,000"
    }
  ],
  "data_source": "live_api",
  "data_sources": {
    "price_source": "coingecko_live",
    "gas_source": "aptos_rpc_live",
    "defi_source": "dexscreener_live"
  }
}
```

---

## 3. POST `/arbitrage/getcharges` - Calculate All Charges

### Input
```json
{
  "from_token": "usdc",
  "to_token": "apt",
  "amount_apt": 120,
  "amount_usd": 1000.0,
  "trade_amount": 500,
  "dex_fees": {
    "Smart Contract": 0.30
  },
  "current_prices": [
    {"usdc": "1.0", "usdt": "0.999", "apt": "12.45"}
  ],
  "apt_price": "12.45"
}
```

**Required Fields:**
- `from_token`: Source token (`"usdc"`, `"apt"`, `"usdt"`)
- `to_token`: Destination token (`"usdc"`, `"apt"`, `"usdt"`)

**Optional Fields:**
- `amount_apt`: Investment amount in APT tokens
- `amount_usd`: Investment amount in USD
- `trade_amount`: Direct trade amount in USD (highest priority)
- `dex_fees`: Custom DEX fees (see DEX Fees section below)
- `current_prices`: Custom token prices array
- `apt_price`: Direct APT price override (string)

### Output
```json
{
  "status": "success",
  "timestamp": "2026-01-08T08:40:50.756240Z",
  "route": {
    "from_pair": "usdc_apt",
    "to_pair": "apt_usdc",
    "from_dex": "dex_a",
    "to_dex": "dex_b",
    "trade_amount": 500.0
  },
  "charges": {
    "dex_fees": {
      "from_dex_fee_percent": 0.30,
      "to_dex_fee_percent": 0.30,
      "from_fee_amount_usd": 1.5,
      "to_fee_amount_usd": 1.5,
      "total_trading_fees_usd": 3.0,
      "fees_applied": true
    },
    "gas_fees": {
      "gas_unit_price_octas": 100,
      "gas_units_per_swap": 1000,
      "total_gas_cost_apt": 0.002,
      "total_gas_cost_usd": 0.0249,
      "operations": 2,
      "apt_price_used": 12.45,
      "gas_source": "live"
    },
    "slippage": {
      "estimated_slippage_percent": 0.05,
      "estimated_slippage_cost_usd": 0.25
    },
    "total_costs": {
      "total_fees_usd": 3.2749,
      "cost_percentage": 0.6550
    },
    "summary": {
      "all_charges_summed": 3.2749,
      "breakdown": {
        "trading_fees": 3.0,
        "gas_costs": 0.0249,
        "slippage": 0.25
      },
      "percentage_of_investment": 0.6550
    }
  },
  "investment_details": {
    "amount_apt": 120,
    "amount_usd": 500.0,
    "apt_price_used": 12.45,
    "dex_fees_applied": true
  },
  "enhanced_analysis": true
}
```

---

## 4. POST `/arbitrage/isprofitable` - Check Profitability

### Input
```json
{
  "from_token": "usdc",
  "to_token": "apt",
  "amount_apt": 120,
  "amount_usd": 1000.0,
  "trade_amount": 500,
  "dex_fees": {
    "Smart Contract": 0.30
  },
  "current_prices": [
    {"usdc": "1.0", "usdt": "0.999", "apt": "12.45"}
  ],
  "apt_price": "12.45"
}
```

**Required Fields:**
- `from_token`: Source token (`"usdc"`, `"apt"`, `"usdt"`)

**Optional Fields:**
- `to_token`: Destination token (if not provided, checks both USDC and USDT)
- `amount_apt`: Investment amount in APT tokens
- `amount_usd`: Investment amount in USD
- `trade_amount`: Direct trade amount in USD (highest priority)
- `dex_fees`: Custom DEX fees
- `current_prices`: Custom token prices array
- `apt_price`: Direct APT price override (string)

### Output
```json
{
  "status": "success",
  "timestamp": "2026-01-08T08:40:50.756240Z",
  "route": {
    "from_pair": "usdc_apt",
    "to_pair": "apt_usdc",
    "from_dex": "dex_a",
    "to_dex": "dex_b",
    "trade_amount": 500.0
  },
  "profitability": {
    "is_profitable": true,
    "price_difference_percent": 1.2233,
    "gross_profit_usd": 6.1165,
    "total_costs_usd": 3.2749,
    "net_profit_usd": 2.8416,
    "profit_margin_percent": 0.5683,
    "roi_percent": 0.5683
  },
  "charges": {
    "dex_fees": {
      "from_dex_fee_percent": 0.30,
      "to_dex_fee_percent": 0.30,
      "from_fee_amount_usd": 1.5,
      "to_fee_amount_usd": 1.5,
      "total_trading_fees_usd": 3.0,
      "fees_applied": true
    },
    "gas_fees": {
      "gas_unit_price_octas": 100,
      "gas_units_per_swap": 1000,
      "total_gas_cost_apt": 0.002,
      "total_gas_cost_usd": 0.0249,
      "operations": 2,
      "apt_price_used": 12.45,
      "gas_source": "live"
    },
    "slippage": {
      "estimated_slippage_percent": 0.05,
      "estimated_slippage_cost_usd": 0.25
    },
    "total_costs": {
      "total_fees_usd": 3.2749,
      "cost_percentage": 0.6550
    }
  },
  "recommendation": "CONSIDER",
  "risk_level": "MEDIUM",
  "investment_details": {
    "amount_apt": null,
    "amount_usd": 500.0,
    "apt_price_used": 12.45
  },
  "enhanced_analysis": true
}
```

---

## 5. POST `/arbitrage/possibilities` - Find All Opportunities

### Input
```json
{
  "amount_apt": 120,
  "amount_usd": 1000.0,
  "trade_amount": 500,
  "dex_fees": {
    "Smart Contract": 0.30
  },
  "current_prices": [
    {"usdc": "1.0", "usdt": "0.999", "apt": "12.45"}
  ],
  "apt_price": "12.45"
}
```

**Optional Fields:**
- `amount_apt`: Investment amount in APT tokens
- `amount_usd`: Investment amount in USD
- `trade_amount`: Direct trade amount in USD (highest priority)
- `dex_fees`: Custom DEX fees (required for analysis)
- `current_prices`: Custom token prices array
- `apt_price`: Direct APT price override (string)

### Output
```json
{
  "status": "success",
  "timestamp": "2026-01-08T08:40:50.756240Z",
  "search_parameters": {
    "trade_amount": 500.0,
    "pairs_checked": 8,
    "available_dexs": ["dex_a", "dex_b"],
    "current_prices": {
      "apt": 12.45,
      "usdc": 1.0,
      "usdt": 0.999
    }
  },
  "opportunities": {
    "total_found": 3,
    "profitable_count": 3,
    "top_opportunities": [
      {
        "route": {
          "from_pair": "usdc_apt",
          "to_pair": "usdt_apt",
          "from_dex": "dex_a",
          "to_dex": "dex_b",
          "trade_amount": 500.0
        },
        "profitability": {
          "is_profitable": true,
          "price_difference_percent": 1.1,
          "gross_profit_usd": 5.5,
          "total_costs_usd": 3.2749,
          "net_profit_usd": 2.2251,
          "profit_margin_percent": 0.4450,
          "roi_percent": 0.4450
        },
        "recommendation": "CONSIDER",
        "risk_level": "MEDIUM"
      }
    ]
  },
  "market_summary": {
    "best_profit_margin": 0.4450,
    "average_profit_margin": 0.3821,
    "recommended_trades": 1
  },
  "investment_details": {
    "amount_apt": 120,
    "amount_usd": 500.0,
    "apt_price_used": 12.45,
    "dex_fees_applied": true
  },
  "enhanced_analysis": true
}
```

---

## 6. POST `/arbitrage/optimize-investment` - Investment Optimization

### Input
```json
{
  "from_token": "usdc",
  "to_token": "apt",
  "max_investment_apt": 50000,
  "dex_fees": {
    "Smart Contract": 0.30
  },
  "current_prices": [
    {"usdc": "1.0", "usdt": "0.999", "apt": "12.45"}
  ],
  "apt_price": "12.45"
}
```

**Required Fields:**
- `from_token`: Source token (`"usdc"`, `"apt"`, `"usdt"`)
- `to_token`: Destination token (`"usdc"`, `"apt"`, `"usdt"`)

**Optional Fields:**
- `max_investment_apt`: Maximum APT investment to consider (default: 50000)
- `dex_fees`: Custom DEX fees
- `current_prices`: Custom token prices array
- `apt_price`: Direct APT price override (string)

### Output
```json
{
  "status": "success",
  "timestamp": "2026-01-08T08:40:50.756240Z",
  "optimization_results": {
    "optimal_investment_apt": 15000,
    "optimal_investment_usd": 186750.0,
    "expected_profit_usd": 1245.67,
    "expected_roi_percent": 0.667,
    "risk_assessment": "MEDIUM"
  },
  "analysis_range": {
    "min_investment_apt": 100,
    "max_investment_apt": 50000,
    "step_size_apt": 500,
    "scenarios_analyzed": 100
  },
  "market_conditions": {
    "from_token": "USDC",
    "to_token": "APT",
    "current_apt_price": 12.45,
    "liquidity_depth": "HIGH",
    "volatility": "MEDIUM"
  }
}
```

---

## 7. GET `/health` - Health Check

### Input
None (GET request)

### Output
```json
{
  "status": "healthy",
  "ecosystem": "aptos",
  "supported_tokens": ["APT", "USDC", "USDT"],
  "timeout_ms": 5000,
  "last_successful_fetch_seconds_ago": 12.3,
  "behavior": "Always fetches live data first, returns stored on timeout",
  "ai_agent": "LangChain-powered",
  "langchain_enabled": true,
  "timestamp": "2026-01-08T08:40:50.756240Z"
}
```

---

## Input Field Details

### Token Values
- **Supported tokens:** `"usdc"`, `"apt"`, `"usdt"`
- **Case insensitive**
- **Format:** Lowercase strings

### Amount Priority (Highest to Lowest)
1. `trade_amount` - Direct trade amount in USD (used as-is)
2. `amount_apt` - Converted to USD using current APT price
3. `amount_usd` - Used directly as USD amount
4. **Default:** `1000.0` USD if none provided

### DEX Fees Format
The API uses a flexible DEX fee system that automatically assigns generic DEX names:

```json
{
  "Smart Contract": 0.30,     // Generic fee applied to both DEXs
  "dex_a": 0.25,             // Specific DEX A fee
  "dex_b": 0.30,             // Specific DEX B fee
  "default": 0.25,           // Default fallback
  "fee": 0.30                // Generic fee key
}
```

**DEX Assignment Logic:**
- If `"Smart Contract"` is provided: Same fee applied to both DEXs (`dex_a` and `dex_b`)
- If specific DEX names provided: Uses exact mapping
- If no fees provided: Uses 0% fees (free trading)
- DEX names in output will be `"dex_a"`, `"dex_b"` for generic scenarios

### Custom Prices Format
```json
[
  {"usdc": "1.0", "usdt": "0.999", "apt": "12.45"},
  {"apt": "15.50"}
]
```

### APT Price Override
- **Format:** String value (e.g., `"12.45"`)
- **Priority:** Takes precedence over `current_prices` and live market data
- **Usage:** Ensures consistent APT price across all calculations

## Example cURL Requests

### Simple Profitability Check
```bash
curl -X POST "http://localhost:8000/arbitrage/isprofitable" \
  -H "Content-Type: application/json" \
  -d '{
    "from_token": "usdc",
    "to_token": "apt",
    "trade_amount": 500,
    "apt_price": "12.45"
  }'
```

### Custom DEX Fees Analysis
```bash
curl -X POST "http://localhost:8000/arbitrage/getcharges" \
  -H "Content-Type: application/json" \
  -d '{
    "from_token": "usdc",
    "to_token": "apt",
    "trade_amount": 1000,
    "dex_fees": {"Smart Contract": 0.30},
    "apt_price": "12.45"
  }'
```

### Find All Opportunities with Custom Prices
```bash
curl -X POST "http://localhost:8000/arbitrage/possibilities" \
  -H "Content-Type: application/json" \
  -d '{
    "trade_amount": 1000,
    "dex_fees": {"Smart Contract": 0.25},
    "current_prices": [{"apt": "15", "usdc": "1.0", "usdt": "0.999"}]
  }'
```

### Investment Optimization
```bash
curl -X POST "http://localhost:8000/arbitrage/optimize-investment" \
  -H "Content-Type: application/json" \
  -d '{
    "from_token": "usdc",
    "to_token": "apt",
    "max_investment_apt": 25000,
    "dex_fees": {"Smart Contract": 0.30}
  }'
```