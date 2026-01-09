# Arbigent Vault API Routes

This document outlines all available API endpoints for the Arbigent vault management system with MongoDB integration.

## Base URL
```
http://localhost:3001/api
```

## Authentication
All vault-related endpoints use the wallet address as the unique identifier. No additional authentication is required.

## Endpoints

### Faucet Endpoints

#### POST /faucet
Request APT tokens from the faucet (testnet only).

**Request Body:**
```json
{
  "address": "0x123...",
  "amount": 10000000
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xabc...",
  "amount": 0.1,
  "message": "Sent 0.1 APT to 0x123..."
}
```

#### GET /health
Check faucet and system health.

**Response:**
```json
{
  "status": "ok",
  "faucetAddress": "0x123...",
  "balance": 100.5,
  "network": "testnet"
}
```

### User Management

#### POST /user/profile
Create or retrieve user profile.

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "publicKey": "0xabc...",
  "ansName": "user.apt"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "walletAddress": "0x123...",
    "publicKey": "0xabc...",
    "ansName": "user.apt",
    "profile": {...},
    "preferences": {...},
    "stats": {...}
  }
}
```

### Vault Management

#### GET /vault/:walletAddress
Get user's vault information.

**Response:**
```json
{
  "success": true,
  "vault": {
    "walletAddress": "0x123...",
    "balances": [
      {
        "coinSymbol": "APT",
        "balance": "1000000000",
        "lockedBalance": "0",
        "earnedRewards": "50000000"
      }
    ],
    "totalValueLocked": 1000.5,
    "strategies": [...],
    "settings": {...}
  }
}
```

#### POST /vault/deposit
Deposit tokens to vault (burns coins, increases vault balance).

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "coinSymbol": "APT",
  "amount": "1000000000",
  "transactionHash": "0xdef..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposited 10 APT to vault",
  "vault": {...},
  "transactionLog": {...}
}
```

#### POST /vault/withdraw
Withdraw tokens from vault (mints coins, decreases vault balance).

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "coinSymbol": "APT",
  "amount": "500000000",
  "transactionHash": "0xghi..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrew 5 APT from vault",
  "vault": {...},
  "transactionLog": {...}
}
```

### Transaction History

#### GET /transactions/:walletAddress
Get user's transaction history.

**Query Parameters:**
- `type`: deposit, withdrawal, burn, mint, reward, fee, transfer
- `status`: pending, confirmed, failed, cancelled
- `coinSymbol`: APT, USDC, USDT
- `limit`: number of results (default: 50)
- `skip`: pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "transactionHash": "0xabc...",
      "type": "deposit",
      "status": "confirmed",
      "coinSymbol": "APT",
      "amount": "1000000000",
      "amountFormatted": 10,
      "fees": {...},
      "vault": {...},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /transactions/:walletAddress/stats
Get transaction statistics.

**Query Parameters:**
- `timeframe`: 24h, 7d, 30d (default: 30d)

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "_id": "deposit",
      "count": 5,
      "totalAmount": 50.5,
      "totalFees": 0.25
    }
  ]
}
```

### Agent Activity

#### POST /agents/log
Create agentic log entry.

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "sessionId": "session-123",
  "agentType": "portfolio_manager",
  "action": "analyze",
  "input": {
    "parameters": {...},
    "context": {...}
  },
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "agenticLog": {
    "walletAddress": "0x123...",
    "sessionId": "session-123",
    "agentType": "portfolio_manager",
    "action": "analyze",
    "status": "initiated",
    "input": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /agents/log/:logId
Update agentic log status and output.

**Request Body:**
```json
{
  "status": "completed",
  "output": {
    "recommendations": [...],
    "analysis": {...},
    "executedActions": [...]
  },
  "error": null
}
```

#### GET /agents/:walletAddress/activity
Get agent activity history.

**Query Parameters:**
- `agentType`: portfolio_manager, risk_analyzer, yield_optimizer, etc.
- `action`: analyze, recommend, execute, monitor, alert, etc.
- `status`: initiated, processing, completed, failed, cancelled
- `priority`: low, medium, high, critical
- `limit`: number of results (default: 50)
- `skip`: pagination offset (default: 0)

#### GET /agents/:walletAddress/stats/:agentType
Get agent performance statistics.

**Query Parameters:**
- `timeframe`: 24h, 7d, 30d (default: 30d)

### Coin Information

#### GET /coins
Get all supported coins.

**Response:**
```json
{
  "success": true,
  "coins": [
    {
      "symbol": "APT",
      "name": "Aptos",
      "contractAddress": "0x1::aptos_coin::AptosCoin",
      "decimals": 8,
      "totalSupply": "1000000000000000000",
      "metadata": {...},
      "vaultConfig": {...}
    }
  ]
}
```

#### GET /coins/vault
Get vault-enabled coins only.

**Response:**
```json
{
  "success": true,
  "coins": [
    {
      "symbol": "APT",
      "name": "Aptos",
      "vaultConfig": {
        "isVaultEnabled": true,
        "minDepositAmount": "100000000",
        "maxDepositAmount": "10000000000000000",
        "depositFee": 0.1,
        "withdrawalFee": 0.1
      }
    }
  ]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request - Missing or invalid parameters
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded (faucet only)
- `500`: Internal Server Error - Server-side error

## Database Models

### User Model
- Stores user profiles with wallet address as unique key
- Tracks user statistics and preferences
- Auto-updates last active time

### Vault Model
- Manages user vault balances per coin
- Tracks strategies, settings, and performance
- Supports balance locking and reward distribution

### Coin Model
- Defines supported coins and their metadata
- Manages burn/mint operations
- Configures vault-specific settings

### TransactionLog Model
- Records all vault transactions
- Tracks smart contract interactions
- Provides transaction history and statistics

### AgenticLog Model
- Logs AI agent activities and decisions
- Tracks performance metrics
- Supports hierarchical log relationships

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `FAUCET_PRIVATE_KEY` for testnet faucet

3. **Start MongoDB:**
   - Local: `mongod --dbpath /path/to/data`
   - Or use MongoDB Atlas cloud service

4. **Seed Database:**
   ```bash
   node scripts/seedCoins.js
   ```

5. **Start Server:**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3001/api`

## Business Logic

### Deposit Flow
1. User initiates deposit transaction on frontend
2. Smart contract burns the deposited coins
3. Backend receives deposit confirmation
4. Vault balance is increased by deposit amount
5. Transaction log is created with burn details
6. User can view updated vault balance

### Withdrawal Flow
1. User requests withdrawal from vault
2. Backend checks sufficient vault balance
3. Smart contract mints new coins to user wallet
4. Vault balance is decreased by withdrawal amount
5. Transaction log is created with mint details
6. User receives coins in their wallet

### Agent Integration
- AI agents can log their activities and decisions
- Performance metrics are tracked per agent type
- Hierarchical logging supports complex agent workflows
- Transaction correlation links agent actions to vault operations