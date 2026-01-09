import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet, RefreshCw, ExternalLink, TrendingUp, Shield, Sparkles, Zap, Lock } from "lucide-react";
import Header from "@/components/Header";
import CryptoLogo from "@/components/CryptoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/contexts/WalletContext";
import { useVault } from "@/hooks/useVault";
import { useMarketData } from "@/hooks/useMarketData";
import { useSmartContractVault } from "@/hooks/useSmartContractVault";
import { balanceService } from "@/services/BalanceService";

// Enhanced Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const floatVariants = {
  float: {
    y: [-5, 5, -5],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

const glowVariants = {
  glow: {
    boxShadow: [
      "0 0 20px rgba(249, 115, 22, 0.2)",
      "0 0 40px rgba(249, 115, 22, 0.4)",
      "0 0 20px rgba(249, 115, 22, 0.2)"
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

const shimmerVariants = {
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 3, repeat: Infinity, ease: "linear" }
  }
};

const Vault = () => {
  const { account, connected } = useWallet();
  const { vault, transactions, isLoading, error, refreshVault, refreshTransactions, getFormattedBalance } = useVault();
  const { tokenPrices } = useMarketData();
  const { 
    isProcessing: contractProcessing, 
    error: contractError, 
    depositAPTDirectToVault,
    depositTokenToVault,
    withdrawFromVault, 
    clearError: clearContractError 
  } = useSmartContractVault();

  const [selectedToken, setSelectedToken] = useState<"APT" | "USDC" | "USDT">("APT");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletBalances, setWalletBalances] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePanel, setActivePanel] = useState<"deposit" | "withdraw">("deposit");
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const supportedTokens: Array<{ symbol: "APT" | "USDC" | "USDT"; name: string; color: string }> = [
    { symbol: "APT", name: "Aptos", color: "from-cyan-400 to-blue-500" },
    { symbol: "USDC", name: "USD Coin", color: "from-blue-400 to-indigo-500" },
    { symbol: "USDT", name: "Tether USD", color: "from-emerald-400 to-teal-500" },
  ];

  useEffect(() => {
    const loadWalletBalances = async () => {
      if (!account?.address) return;
      try {
        const aptBalance = await balanceService.fetchAPTBalance(account.address);
        const usdcBalance = await balanceService.fetchUSDCBalance(account.address);
        const usdtBalance = await balanceService.fetchUSDTBalance(account.address);
        setWalletBalances({ APT: aptBalance, USDC: usdcBalance, USDT: usdtBalance });
      } catch (err) {
        setWalletBalances({ APT: '0', USDC: '0', USDT: '0' });
      }
    };
    if (connected && account?.address) {
      loadWalletBalances();
      const interval = setInterval(loadWalletBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [account?.address, connected]);

  const getTokenData = (symbol: "APT" | "USDC" | "USDT") => {
    const vaultBalance = getFormattedBalance(symbol);
    const walletBalance = walletBalances[symbol] || '0';
    const priceData = tokenPrices[symbol];
    const balance = parseFloat(vaultBalance) || 0;
    const price = priceData?.priceNum || 0;
    const usdValue = balance * price;
    return {
      symbol, balance: vaultBalance, walletBalance,
      usdValue: `${(Math.floor(usdValue * 100) / 100).toFixed(2)}`,
      price: priceData ? `$${priceData.priceNum.toFixed(2)}` : '$0.00',
      change: priceData?.change || '0.0%',
      isPositive: priceData?.change?.startsWith('+') ?? true
    };
  };

  const tokens = supportedTokens.map(token => ({ ...getTokenData(token.symbol), color: token.color }));
  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);
  const totalVaultValue = tokens.reduce((sum, t) => sum + parseFloat(t.usdValue), 0);

  const handleDeposit = async () => {
    if (!account?.address || !depositAmount || isProcessing || contractProcessing) return;
    setIsProcessing(true);
    clearContractError();
    setLocalError(null);
    try {
      let success = false;
      if (selectedToken === 'APT') {
        success = await depositAPTDirectToVault(depositAmount);
      } else {
        const walletBalance = parseFloat(walletBalances[selectedToken] || '0');
        if (parseFloat(depositAmount) > walletBalance) {
          setLocalError(`Insufficient ${selectedToken} balance`);
          setIsProcessing(false);
          return;
        }
        success = await depositTokenToVault(depositAmount, selectedToken);
      }
      if (success) {
        setDepositAmount("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        const newBalances = await balanceService.refreshBalances(account.address);
        setWalletBalances(newBalances);
        await refreshVault();
        await refreshTransactions();
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account?.address || !withdrawAmount || isProcessing || contractProcessing) return;
    setIsProcessing(true);
    clearContractError();
    try {
      const success = await withdrawFromVault(withdrawAmount, selectedToken);
      if (success) {
        setWithdrawAmount("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        const newBalances = await balanceService.refreshBalances(account.address);
        setWalletBalances(newBalances);
        await refreshVault();
        await refreshTransactions();
      }
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const setPercentage = (percentage: number, isDeposit: boolean) => {
    const balance = isDeposit ? selectedTokenData?.walletBalance : selectedTokenData?.balance;
    if (!balance) return;
    const amount = (parseFloat(balance) * percentage / 100).toFixed(6);
    if (isDeposit) setDepositAmount(amount);
    else setWithdrawAmount(amount);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center p-10 rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-xl relative z-10"
        >
          <motion.div 
            animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-full blur-2xl opacity-30" />
            <Wallet className="h-20 w-20 mx-auto mb-6 text-primary relative z-10" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Wallet Not Connected
          </h2>
          <p className="text-muted-foreground text-lg">Connect your wallet to access the vault</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark relative overflow-hidden">
      {/* Animated Background - Low brightness for eye comfort */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/[0.07] rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/[0.03] to-orange-500/[0.03] rounded-full blur-3xl" />
      </div>
      
      <Header />
      
      <main className="pt-24 pb-16 relative z-10">
        <motion.div 
          className="container mx-auto px-4 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Back Link */}
          <motion.div variants={itemVariants}>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mb-8 group"
            >
              <motion.div whileHover={{ x: -5 }} transition={{ type: "spring", stiffness: 400 }}>
                <ArrowLeft className="h-4 w-4" />
              </motion.div>
              <span className="group-hover:underline underline-offset-4">Back to Dashboard</span>
            </Link>
          </motion.div>
          
          {/* Page Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-4"
              variants={floatVariants}
              animate="float"
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-2xl blur-xl opacity-50"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative bg-gradient-to-br from-primary/20 to-orange-500/20 p-4 rounded-2xl border border-primary/30">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </motion.div>
              <motion.h1 
                className="font-display text-5xl lg:text-7xl font-bold tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #f97316 0%, #fb923c 25%, #f97316 50%, #ea580c 75%, #f97316 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                VAULT
              </motion.h1>
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshVault}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>
            </motion.div>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Securely manage your funds for automated trading
            </motion.p>
          </motion.div>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
              >
                <motion.div 
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3"
                  animate={{ boxShadow: ["0 25px 50px -12px rgba(16, 185, 129, 0.3)", "0 25px 50px -12px rgba(16, 185, 129, 0.5)", "0 25px 50px -12px rgba(16, 185, 129, 0.3)"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                  <span className="font-bold text-lg">Transaction Successful!</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Total Value Card */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div 
              className="rounded-3xl border border-primary/30 p-8 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(17, 24, 39, 0.8) 50%, rgba(234, 88, 12, 0.1) 100%)" }}
              whileHover={{ scale: 1.01, borderColor: "rgba(249, 115, 22, 0.5)" }}
              transition={{ duration: 0.3 }}
              variants={glowVariants}
              animate="glow"
            >
              {/* Animated gradient orbs */}
              <motion.div 
                className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/30 to-orange-500/30 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <motion.p 
                    className="text-muted-foreground text-sm mb-2 flex items-center gap-2 justify-center md:justify-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Shield className="h-4 w-4 text-primary" /> 
                    <span>Total Vault Value</span>
                  </motion.p>
                  <motion.div
                    key={totalVaultValue}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-baseline gap-2"
                  >
                    <span className="text-2xl text-muted-foreground">$</span>
                    <motion.span 
                      className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-primary to-orange-400 bg-clip-text text-transparent"
                      animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      style={{ backgroundSize: "200%" }}
                    >
                      {totalVaultValue.toFixed(2)}
                    </motion.span>
                  </motion.div>
                </div>
                <motion.div 
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
                  whileHover={{ scale: 1.05 }}
                  animate={{ boxShadow: ["0 0 20px rgba(16, 185, 129, 0.1)", "0 0 30px rgba(16, 185, 129, 0.2)", "0 0 20px rgba(16, 185, 129, 0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div animate={{ y: [-2, 2, -2] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </motion.div>
                  <span className="font-mono text-emerald-400 font-bold">SECURED</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Balance Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {tokens.map((token, index) => (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-2xl border p-6 cursor-pointer overflow-hidden transition-all duration-300 ${
                  selectedToken === token.symbol 
                    ? "border-primary/50 bg-gradient-to-br from-primary/10 via-card to-orange-500/10 shadow-xl shadow-primary/20" 
                    : "border-border bg-card/80 backdrop-blur-sm hover:border-primary/30"
                }`}
                onClick={() => setSelectedToken(token.symbol)}
              >
                {/* Gradient overlay on selection */}
                {selectedToken === token.symbol && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-500/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layoutId="selectedCard"
                  />
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={selectedToken === token.symbol ? { 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ duration: 0.6 }}
                      className={`p-2 rounded-xl bg-gradient-to-br ${token.color} bg-opacity-20`}
                    >
                      <CryptoLogo symbol={token.symbol} size="lg" />
                    </motion.div>
                    <div>
                      <p className="font-display font-bold text-xl text-foreground">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">Vault Balance</p>
                    </div>
                  </div>
                  
                  <motion.p 
                    className="font-mono text-3xl font-bold text-foreground mb-1"
                    key={token.balance}
                    initial={{ scale: 1.1, color: "#f97316" }}
                    animate={{ scale: 1, color: "inherit" }}
                  >
                    {token.balance}
                  </motion.p>
                  <p className="text-sm text-muted-foreground mb-3">≈ ${token.usdValue}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Wallet: <span className="text-foreground font-mono">{token.walletBalance}</span>
                    </span>
                    <span className={`text-sm font-mono ${token.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {token.change}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Deposit/Withdraw Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Deposit Panel */}
            <motion.div 
              className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 relative overflow-hidden"
              whileHover={{ borderColor: "rgba(249, 115, 22, 0.5)" }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-lg shadow-primary/30"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">DEPOSIT</h2>
                    <p className="text-sm text-muted-foreground">Add funds to your vault</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-muted-foreground mb-3 block font-medium">Select Token</label>
                    <div className="flex gap-2">
                      {supportedTokens.map((token) => (
                        <motion.button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token.symbol)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 py-3.5 px-4 rounded-xl font-mono text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            selectedToken === token.symbol
                              ? `bg-gradient-to-r ${token.color} text-white shadow-lg`
                              : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-border"
                          }`}
                        >
                          <CryptoLogo symbol={token.symbol} size="sm" />
                          {token.symbol}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-3 block font-medium">Amount</label>
                    <div className="relative group">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="font-mono text-2xl h-16 pr-20 bg-muted/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CryptoLogo symbol={selectedToken} size="md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        Available: <span className="text-foreground font-mono">{selectedTokenData?.walletBalance || '0'}</span>
                      </span>
                      <div className="flex gap-1.5">
                        {[25, 50, 75, 100].map((pct) => (
                          <motion.button
                            key={pct}
                            onClick={() => setPercentage(pct, true)}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(249, 115, 22, 0.2)" }}
                            whileTap={{ scale: 0.9 }}
                            className="px-3 py-1.5 text-xs font-mono bg-muted/50 rounded-lg text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/30"
                          >
                            {pct === 100 ? 'MAX' : `${pct}%`}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="glow" 
                      size="lg" 
                      className="w-full font-display tracking-wide font-bold h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg shadow-primary/30"
                      onClick={handleDeposit}
                      disabled={!depositAmount || isProcessing || isLoading}
                    >
                      {isProcessing ? (
                        <motion.div className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap className="h-5 w-5" />
                          </motion.div>
                          <span>PROCESSING...</span>
                        </motion.div>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Download className="h-5 w-5" /> DEPOSIT
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Withdraw Panel */}
            <motion.div 
              className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 relative overflow-hidden"
              whileHover={{ borderColor: "rgba(245, 158, 11, 0.5)" }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Upload className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">WITHDRAW</h2>
                    <p className="text-sm text-muted-foreground">Remove funds from vault</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-muted-foreground mb-3 block font-medium">Select Token</label>
                    <div className="flex gap-2">
                      {supportedTokens.map((token) => (
                        <motion.button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token.symbol)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 py-3.5 px-4 rounded-xl font-mono text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            selectedToken === token.symbol
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-border"
                          }`}
                        >
                          <CryptoLogo symbol={token.symbol} size="sm" />
                          {token.symbol}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-3 block font-medium">Amount</label>
                    <div className="relative group">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="font-mono text-2xl h-16 pr-20 bg-muted/50 border-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CryptoLogo symbol={selectedToken} size="md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        Vault: <span className="text-foreground font-mono">{selectedTokenData?.balance || '0'}</span>
                      </span>
                      <div className="flex gap-1.5">
                        {[25, 50, 75, 100].map((pct) => (
                          <motion.button
                            key={pct}
                            onClick={() => setPercentage(pct, false)}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(245, 158, 11, 0.2)" }}
                            whileTap={{ scale: 0.9 }}
                            className="px-3 py-1.5 text-xs font-mono bg-muted/50 rounded-lg text-muted-foreground hover:text-amber-500 transition-all border border-transparent hover:border-amber-500/30"
                          >
                            {pct === 100 ? 'MAX' : `${pct}%`}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="warning" 
                      size="lg" 
                      className="w-full font-display tracking-wide font-bold h-14 text-lg rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500/90 hover:to-yellow-500/90 text-white shadow-lg shadow-amber-500/30"
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || isProcessing || isLoading}
                    >
                      {isProcessing ? (
                        <motion.div className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap className="h-5 w-5" />
                          </motion.div>
                          <span>PROCESSING...</span>
                        </motion.div>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Upload className="h-5 w-5" /> WITHDRAW
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {(error || contractError || localError) && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mb-8 p-5 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                      <Zap className="h-5 w-5 text-red-400" />
                    </div>
                    <span className="font-medium text-red-400">{error || contractError || localError}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (contractError) clearContractError();
                      if (localError) setLocalError(null);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <span className="text-red-400 text-xl">×</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction History */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 bg-primary/10 rounded-xl"
                  whileHover={{ rotate: 10 }}
                >
                  <ExternalLink className="h-5 w-5 text-primary" />
                </motion.div>
                <h2 className="font-display text-xl font-bold text-foreground">RECENT TRANSACTIONS</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={refreshTransactions}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            </div>
            
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx, index) => (
                    <motion.div 
                      key={tx.transactionHash || index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.05)" }}
                      className="px-6 py-5 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            tx.type === "deposit" 
                              ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30" 
                              : "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
                          }`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {tx.type === "deposit" ? (
                            <Download className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Upload className="h-5 w-5 text-amber-400" />
                          )}
                        </motion.div>
                        <div className="flex items-center gap-3">
                          <CryptoLogo symbol={tx.coinSymbol as "APT" | "USDC" | "USDT"} size="sm" />
                          <div>
                            <p className={`font-mono font-bold text-lg ${tx.type === "deposit" ? "text-emerald-400" : "text-amber-400"}`}>
                              {tx.type === "deposit" ? "+" : "-"}{tx.amountFormatted} {tx.coinSymbol}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <motion.span 
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-mono font-bold ${
                            tx.status === 'confirmed' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {tx.status === 'confirmed' ? '✓' : tx.status === 'pending' ? '⏳' : '✗'} {tx.status}
                        </motion.span>
                        <motion.a 
                          href={`https://explorer.aptoslabs.com/txn/${tx.transactionHash}?network=testnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                          whileHover={{ scale: 1.05, x: 3 }}
                        >
                          {tx.transactionHash.slice(0, 6)}...{tx.transactionHash.slice(-4)}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </motion.a>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-6 py-20 text-center"
                  >
                    <motion.div 
                      className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 mx-auto mb-6"
                      animate={{ y: [-5, 5, -5], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Wallet className="h-12 w-12 text-muted-foreground" />
                    </motion.div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">Make your first deposit to get started!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Vault;
