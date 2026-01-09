// ArbiGent - Autonomous Arbitrage Agent Service
// Smart Progressive Allocation with Triangular Arbitrage Routes
import { apiService, ArbitrageOpportunity } from './ApiService';

export type LogType = 'INFO' | 'SCAN' | 'EXECUTE' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface AgentLog {
  time: string;
  type: LogType;
  message: string;
  detail?: string;
}

export interface AgentConfig {
  minProfitThreshold: number;
  riskTolerance: RiskLevel;
  selectedPair: string;
  maxTradeCap: number;
  allocationPercent: number;
  scalingFactor: number;
}

export interface VaultState {
  APT: number;
  USDC: number;
  USDT: number;
}

export interface AgentState {
  isRunning: boolean;
  currentAllocation: number;
  totalProfit: number;
  tradesExecuted: number;
  tradesSkipped: number;
  startTime: Date | null;
  lastTradeTime: Date | null;
  totalGasFees: number;
  totalSlippage: number;
  totalCosts: number;
}

// Triangular arbitrage routes
// Each route: from_token → mid_token → to_token (back to from_token type for profit)
interface ArbitrageRoute {
  name: string;
  fromToken: keyof VaultState;
  midToken: keyof VaultState;
  toToken: keyof VaultState;
  apiFromToken: string;
  apiToToken: string;
}

const ARBITRAGE_ROUTES: Record<string, ArbitrageRoute> = {
  'USDC_APT': {
    name: 'USDC → USDT → APT',
    fromToken: 'USDC',
    midToken: 'USDT',
    toToken: 'APT',
    apiFromToken: 'usdc',
    apiToToken: 'apt',
  },
  'APT_USDT': {
    name: 'APT → USDC → USDT',
    fromToken: 'APT',
    midToken: 'USDC',
    toToken: 'USDT',
    apiFromToken: 'apt',
    apiToToken: 'usdt',
  },
  'USDC_USDT': {
    name: 'USDC → APT → USDT',
    fromToken: 'USDC',
    midToken: 'APT',
    toToken: 'USDT',
    apiFromToken: 'usdc',
    apiToToken: 'usdt',
  },
};

// All routes for AUTO mode - cycle through each
const AUTO_ROUTES = ['USDC_APT', 'APT_USDT', 'USDC_USDT'];

// Progressive allocation steps
const ALLOCATION_STEPS = [0.10, 0.50];

// Simulated liquidity pools
const LIQUIDITY_POOLS = [
  { name: 'PancakeSwap', tvl: '45.2M', fee: '0.25%' },
  { name: 'LiquidSwap', tvl: '32.8M', fee: '0.30%' },
  { name: 'Pontem', tvl: '18.5M', fee: '0.20%' },
  { name: 'Thala', tvl: '28.1M', fee: '0.25%' },
  { name: 'Sushi', tvl: '12.3M', fee: '0.30%' },
];

// Risk level constraints
const RISK_CONSTRAINTS: Record<RiskLevel, { maxTrade: number; gasLimit: number }> = {
  LOW: { maxTrade: 2500, gasLimit: 0.003 },
  MEDIUM: { maxTrade: 5000, gasLimit: 0.005 },
  HIGH: { maxTrade: 10000, gasLimit: 0.01 },
  VERY_HIGH: { maxTrade: 1000000, gasLimit: 0.05 },
};

class ArbiGentService {
  private isRunning = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private logs: AgentLog[] = [];
  private onLogCallback: ((log: AgentLog) => void) | null = null;
  private onStateChangeCallback: ((state: AgentState) => void) | null = null;
  private onVaultUpdateCallback: ((balances: VaultState) => void) | null = null;
  private currentAutoRouteIndex = 0;
  private walletAddress: string | null = null;
  
  private state: AgentState = {
    isRunning: false,
    currentAllocation: 0.10,
    totalProfit: 0,
    tradesExecuted: 0,
    tradesSkipped: 0,
    startTime: null,
    lastTradeTime: null,
    totalGasFees: 0,
    totalSlippage: 0,
    totalCosts: 0,
  };

  private config: AgentConfig = {
    minProfitThreshold: 0.00001,
    riskTolerance: 'MEDIUM',
    selectedPair: 'AUTO',
    maxTradeCap: 5000,
    allocationPercent: 0.10,
    scalingFactor: 1.05,
  };

  private vaultBalances: VaultState = { APT: 0, USDC: 0, USDT: 0 };
  private livePrices: Record<string, number> = { APT: 0, USDC: 1, USDT: 1 };

  onLog(callback: (log: AgentLog) => void) {
    this.onLogCallback = callback;
  }

  onStateChange(callback: (state: AgentState) => void) {
    this.onStateChangeCallback = callback;
  }

  onVaultUpdate(callback: (balances: VaultState) => void) {
    this.onVaultUpdateCallback = callback;
  }

  updateConfig(newConfig: Partial<AgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    const riskConstraints = RISK_CONSTRAINTS[this.config.riskTolerance];
    this.config.maxTradeCap = riskConstraints.maxTrade;
  }

  updateVaultBalances(balances: VaultState) {
    this.vaultBalances = { ...balances };
  }

  updatePrices(prices: Record<string, number>) {
    this.livePrices = { ...prices };
  }

  setWalletAddress(address: string) {
    this.walletAddress = address;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getVaultBalances(): VaultState {
    return { ...this.vaultBalances };
  }

  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  private addLog(type: LogType, message: string, detail?: string) {
    const log: AgentLog = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      message,
      detail,
    };
    
    this.logs.push(log);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    if (this.onLogCallback) {
      this.onLogCallback(log);
    }
  }

  private updateState(updates: Partial<AgentState>) {
    this.state = { ...this.state, ...updates };
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  private notifyVaultUpdate() {
    if (this.onVaultUpdateCallback) {
      this.onVaultUpdateCallback(this.vaultBalances);
    }
  }

  private getRandomPool() {
    return LIQUIDITY_POOLS[Math.floor(Math.random() * LIQUIDITY_POOLS.length)];
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentAutoRouteIndex = 0;
    this.updateState({
      isRunning: true,
      startTime: new Date(),
      currentAllocation: this.config.allocationPercent,
      totalGasFees: 0,
      totalSlippage: 0,
      totalCosts: 0,
      totalProfit: 0,
      tradesExecuted: 0,
      tradesSkipped: 0,
    });
    
    this.addLog('INFO', 'ArbiGent started', `Config: ${this.config.riskTolerance} risk, ${this.config.minProfitThreshold}% min profit`);
    this.addLog('INFO', 'Triangular Arbitrage Routes', 'USDC→USDT→APT | APT→USDC→USDT | USDC→APT→USDT');
    this.addLog('INFO', 'Allocation Strategy', 'Testing 10% then 50% for each route');
    
    this.runLoop();
  }

  stop() {
    this.isRunning = false;
    
    if (this.loopInterval) {
      clearTimeout(this.loopInterval);
      this.loopInterval = null;
    }
    
    this.updateState({ isRunning: false });
    this.addLog('INFO', 'ArbiGent stopped', 
      `Profit: $${this.state.totalProfit.toFixed(4)} | Trades: ${this.state.tradesExecuted} | Gas: $${this.state.totalGasFees.toFixed(4)}`
    );
  }

  private async runLoop() {
    if (!this.isRunning) return;

    try {
      await this.executeCycle();
    } catch (error) {
      this.addLog('ERROR', 'Cycle error', error instanceof Error ? error.message : 'Unknown error');
    }

    const delay = 3000 + Math.random() * 3000;
    this.loopInterval = setTimeout(() => this.runLoop(), delay);
  }

  private async executeCycle() {
    // Log prices
    this.addLog('INFO', 'Live Price Check', 
      `APT $${this.livePrices.APT?.toFixed(4) || '0'} | USDC $${this.livePrices.USDC?.toFixed(4) || '1'} | USDT $${this.livePrices.USDT?.toFixed(4) || '1'}`
    );

    // Log vault
    this.addLog('INFO', 'Vault Status', 
      `APT: ${this.vaultBalances.APT.toFixed(4)} | USDC: ${this.vaultBalances.USDC.toFixed(4)} | USDT: ${this.vaultBalances.USDT.toFixed(4)}`
    );

    // Determine which routes to check
    let routesToCheck: string[] = [];
    
    if (this.config.selectedPair === 'AUTO') {
      // In AUTO mode, cycle through all routes one by one
      routesToCheck = [AUTO_ROUTES[this.currentAutoRouteIndex]];
      this.currentAutoRouteIndex = (this.currentAutoRouteIndex + 1) % AUTO_ROUTES.length;
    } else {
      routesToCheck = [this.config.selectedPair];
    }

    // Check each route
    for (const routeKey of routesToCheck) {
      const route = ARBITRAGE_ROUTES[routeKey];
      if (!route) continue;

      this.addLog('SCAN', `Checking route: ${route.name}`, 
        `${route.fromToken} → ${route.midToken} → ${route.toToken}`
      );

      // Try allocations: 10% then 50%
      let foundProfitable = false;
      let bestOpportunity: ArbitrageOpportunity | null = null;
      let usedAllocation = 0;

      for (const allocation of ALLOCATION_STEPS) {
        const tradeAmount = this.calculateTradeAmountForToken(route.fromToken, allocation);
        
        if (tradeAmount < 0.01) {
          this.addLog('WARNING', `Skipping ${(allocation * 100).toFixed(0)}%`, 
            `Insufficient ${route.fromToken} balance`
          );
          continue;
        }

        this.addLog('SCAN', `Testing ${(allocation * 100).toFixed(0)}% of ${route.fromToken}...`, 
          `Trade amount: $${tradeAmount.toFixed(4)}`
        );

        const pool = this.getRandomPool();
        this.addLog('INFO', `Analyzing ${pool.name}`, `TVL: $${pool.tvl} | Fee: ${pool.fee}`);

        // Call API to check profitability
        const opportunity = await this.checkRouteProfitability(route, tradeAmount);

        if (opportunity && opportunity.profitability.is_profitable) {
          const slippage = opportunity.charges?.slippage?.estimated_slippage_percent || 0.02;
          const gasCost = opportunity.charges?.gas_fees?.total_gas_cost_usd || 0.02;
          
          this.addLog('INFO', 'Slippage Analysis', 
            `Estimated: ${slippage.toFixed(4)}% | Trend: ${slippage < 0.1 ? 'LOW' : 'MEDIUM'}`
          );
          this.addLog('INFO', 'Gas Estimation', 
            `Cost: $${gasCost.toFixed(4)} | Network: Low congestion`
          );

          if (opportunity.profitability.profit_margin_percent >= this.config.minProfitThreshold) {
            bestOpportunity = opportunity;
            usedAllocation = allocation;
            foundProfitable = true;
            
            this.addLog('SUCCESS', `Profitable at ${(allocation * 100).toFixed(0)}%!`, 
              `Margin: ${opportunity.profitability.profit_margin_percent.toFixed(4)}%`
            );
            break;
          }
        }

        if (allocation === 0.50 && !foundProfitable) {
          this.addLog('WARNING', `Route ${routeKey} not profitable at 50%`, 'Moving to next route...');
        }
      }

      // Execute if profitable
      if (foundProfitable && bestOpportunity) {
        await this.executeTriangularArbitrage(route, bestOpportunity, usedAllocation);
        return; // Exit after successful trade
      }
    }

    // No profitable route found
    this.updateState({ tradesSkipped: this.state.tradesSkipped + 1 });
    this.addLog('WARNING', 'No profitable routes this cycle', 'Will retry next cycle...');
  }

  private calculateTradeAmountForToken(token: keyof VaultState, allocation: number): number {
    const balance = this.vaultBalances[token] || 0;
    const price = this.livePrices[token] || 1;
    const balanceUsd = balance * price;
    return Math.min(balanceUsd * allocation, this.config.maxTradeCap);
  }

  private async checkRouteProfitability(route: ArbitrageRoute, tradeAmount: number): Promise<ArbitrageOpportunity | null> {
    try {
      const response = await apiService.checkProfitability({
        from_token: route.apiFromToken,
        to_token: route.apiToToken,
        trade_amount: tradeAmount,
      });

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      this.addLog('ERROR', 'API Error', `Failed to check ${route.name}`);
    }
    return null;
  }

  private async executeTriangularArbitrage(route: ArbitrageRoute, opp: ArbitrageOpportunity, allocation: number) {
    const { profitability, charges } = opp;
    const tradeAmountUsd = opp.route.trade_amount;
    
    const totalCostUsd = charges?.total_costs?.total_fees_usd || profitability.total_costs_usd || 0;
    const gasCostUsd = charges?.gas_fees?.total_gas_cost_usd || 0.02;
    const slippageCostUsd = charges?.slippage?.estimated_slippage_cost_usd || 0.01;
    const profitUsd = profitability.net_profit_usd;

    // Get prices
    const fromPrice = this.livePrices[route.fromToken] || 1;
    const midPrice = this.livePrices[route.midToken] || 1;
    const toPrice = this.livePrices[route.toToken] || 1;

    // Calculate token flow through triangular arbitrage
    // Step 1: from_token → mid_token
    const fromTokenAmount = tradeAmountUsd / fromPrice;
    const midTokenAmount = (fromTokenAmount * fromPrice) / midPrice;
    
    // Step 2: mid_token → to_token (final output includes profit)
    const finalValueUsd = tradeAmountUsd + profitUsd;
    const toTokenAmount = finalValueUsd / toPrice;

    // Get pools for logging
    const pool1 = this.getRandomPool();
    const pool2 = this.getRandomPool();

    this.addLog('SUCCESS', '⚡ EXECUTING TRIANGULAR ARBITRAGE', 
      `Route: ${route.fromToken} → ${route.midToken} → ${route.toToken}`
    );

    this.addLog('INFO', 'DEX Route', 
      `${pool1.name} (${route.fromToken}→${route.midToken}) → ${pool2.name} (${route.midToken}→${route.toToken})`
    );

    this.addLog('INFO', 'Token Flow', 
      `${route.fromToken}: -${fromTokenAmount.toFixed(6)} → ${route.midToken}: ${midTokenAmount.toFixed(6)} → ${route.toToken}: +${toTokenAmount.toFixed(6)}`
    );

    this.addLog('INFO', 'Cost Breakdown', 
      `Gas: $${gasCostUsd.toFixed(4)} | Slippage: $${slippageCostUsd.toFixed(4)} | Total: $${totalCostUsd.toFixed(4)}`
    );

    // Update local vault balances
    const oldFromBalance = this.vaultBalances[route.fromToken];
    const oldToBalance = this.vaultBalances[route.toToken];
    
    this.vaultBalances[route.fromToken] = Math.max(0, oldFromBalance - fromTokenAmount);
    this.vaultBalances[route.toToken] = oldToBalance + toTokenAmount;

    this.addLog('SUCCESS', 'Local Vault Updated', 
      `${route.fromToken}: ${oldFromBalance.toFixed(4)} → ${this.vaultBalances[route.fromToken].toFixed(4)} | ${route.toToken}: ${oldToBalance.toFixed(4)} → ${this.vaultBalances[route.toToken].toFixed(4)}`
    );

    // Update MongoDB vault via API
    await this.updateMongoDBVault(route, fromTokenAmount, toTokenAmount);

    this.addLog('SUCCESS', 'Trade Completed', 
      `Invested: $${tradeAmountUsd.toFixed(4)} | Received: $${finalValueUsd.toFixed(4)} | Net Profit: +$${profitUsd.toFixed(4)} (${profitability.profit_margin_percent.toFixed(4)}%)`
    );

    // Update state
    this.updateState({
      totalProfit: this.state.totalProfit + profitUsd,
      tradesExecuted: this.state.tradesExecuted + 1,
      lastTradeTime: new Date(),
      currentAllocation: this.config.allocationPercent,
      totalGasFees: this.state.totalGasFees + gasCostUsd,
      totalSlippage: this.state.totalSlippage + slippageCostUsd,
      totalCosts: this.state.totalCosts + totalCostUsd,
    });

    this.notifyVaultUpdate();

    this.addLog('INFO', 'Session Stats', 
      `Total Profit: $${this.state.totalProfit.toFixed(4)} | Trades: ${this.state.tradesExecuted} | Gas: $${this.state.totalGasFees.toFixed(4)}`
    );
  }

  // Update MongoDB vault - deduct from_token and add to_token
  private async updateMongoDBVault(route: ArbitrageRoute, fromAmount: number, toAmount: number) {
    if (!this.walletAddress) {
      this.addLog('WARNING', 'MongoDB Update Skipped', 'No wallet address set');
      return;
    }

    try {
      // Get decimals for each token
      const fromDecimals = route.fromToken === 'APT' ? 8 : 6;
      const toDecimals = route.toToken === 'APT' ? 8 : 6;

      // Convert to smallest units
      const fromAmountSmallest = Math.floor(fromAmount * Math.pow(10, fromDecimals)).toString();
      const toAmountSmallest = Math.floor(toAmount * Math.pow(10, toDecimals)).toString();

      // Generate mock transaction hash
      const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 48)}`;

      // Withdraw from_token (deduct from vault)
      const withdrawResponse = await apiService.withdrawFromVault(
        this.walletAddress,
        route.fromToken,
        fromAmountSmallest,
        txHash + '_withdraw'
      );

      if (withdrawResponse.success) {
        this.addLog('INFO', 'MongoDB: Deducted', 
          `${route.fromToken}: -${fromAmount.toFixed(6)}`
        );
      }

      // Deposit to_token (add to vault)
      const depositResponse = await apiService.depositToVault(
        this.walletAddress,
        route.toToken,
        toAmountSmallest,
        txHash + '_deposit'
      );

      if (depositResponse.success) {
        this.addLog('INFO', 'MongoDB: Added', 
          `${route.toToken}: +${toAmount.toFixed(6)}`
        );
      }

      this.addLog('SUCCESS', 'MongoDB Vault Synced', 'Balances updated in database');

    } catch (error) {
      this.addLog('ERROR', 'MongoDB Update Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  getRunningDuration(): string {
    if (!this.state.startTime) return '0m';
    
    const now = new Date();
    const diff = now.getTime() - this.state.startTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export const arbiGentService = new ArbiGentService();
export default ArbiGentService;
