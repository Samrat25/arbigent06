# Aptos Faucet Backend

A simple Node.js backend that provides a faucet service for Aptos Testnet.

## Setup

1. **Install dependencies:**
```bash
cd faucet-backend
npm install
```

2. **Get testnet account private key:**
```bash
cd ../move
aptos init --profile testnet --network testnet
```

3. **Fund the faucet account:**
Visit https://aptos.dev/network/faucet and paste your account address to get testnet APT.

4. **Get your private key:**
```bash
# On Windows
type %USERPROFILE%\.aptos\config.yaml

# On Mac/Linux
cat ~/.aptos/config.yaml
```

Look for the `private_key` under the `testnet` profile.

5. **Create .env file:**
```bash
cp .env.example .env
```

Edit `.env` and add your private key:
```
FAUCET_PRIVATE_KEY=0x...your_private_key_here...
PORT=3001
```

6. **Start the server:**
```bash
npm start
```

The faucet will run on http://localhost:3001

## API Endpoints

### POST /api/faucet
Request APT from the faucet.

**Request:**
```json
{
  "address": "0x...",
  "amount": 100000000
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": 1,
  "message": "Sent 1 APT to 0x..."
}
```

### GET /api/health
Check faucet status and balance.

**Response:**
```json
{
  "status": "ok",
  "faucetAddress": "0x...",
  "balance": 10.5,
  "network": "testnet"
}
```

## Rate Limiting

- Max 5 requests per hour per address
- Prevents abuse

## Security Notes

- Keep your `.env` file secure
- Never commit private keys to git
- The `.env` file is in `.gitignore`
