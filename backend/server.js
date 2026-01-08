import express from 'express';
import cors from 'cors';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

// Load faucet account from environment variable
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
if (!FAUCET_PRIVATE_KEY) {
  console.error('FAUCET_PRIVATE_KEY not set in .env file');
  process.exit(1);
}

const faucetAccount = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(FAUCET_PRIVATE_KEY)
});

console.log('Faucet account:', faucetAccount.accountAddress.toString());

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT_MINUTES = 60;
const MAX_REQUESTS_PER_HOUR = 5;

function checkRateLimit(address) {
  const now = Date.now();
  const requests = requestLog.get(address) || [];
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_MINUTES * 60 * 1000);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  recentRequests.push(now);
  requestLog.set(address, recentRequests);
  return true;
}

// Faucet endpoint
app.post('/api/faucet', async (req, res) => {
  try {
    const { address, amount = 10000000 } = req.body; // Default 0.1 APT (reduced from 1 APT)
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Check rate limit
    if (!checkRateLimit(address)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Try again in an hour.' 
      });
    }

    // Transfer APT from faucet account
    const transaction = await aptos.transaction.build.simple({
      sender: faucetAccount.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [address, amount],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: faucetAccount,
      transaction,
    });

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    res.json({
      success: true,
      txHash: committedTxn.hash,
      amount: amount / 100000000,
      message: `Sent ${amount / 100000000} APT to ${address}`,
    });

  } catch (error) {
    console.error('Faucet error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process faucet request' 
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: faucetAccount.accountAddress,
    });
    
    res.json({
      status: 'ok',
      faucetAddress: faucetAccount.accountAddress.toString(),
      balance: balance / 100000000,
      network: 'testnet',
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Faucet backend running on port ${PORT}`);
  console.log(`Network: TESTNET`);
});
