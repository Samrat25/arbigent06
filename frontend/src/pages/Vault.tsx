import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet, RefreshCw, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import CryptoLogo from "@/components/CryptoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Vault = () => {
  const [selectedToken, setSelectedToken] = useState<"APT" | "USDC" | "USDT">("APT");
  const [amount, setAmount] = useState("");
  
  const isConnected = true;
  const walletAddress = "0x1a2b3c4d5e6f7890abcdef1234567890abcd3f4c";
  
  const tokens: { symbol: "APT" | "USDC" | "USDT"; balance: string; usdValue: string; price: string; change: string; isPositive: boolean }[] = [
    { symbol: "APT", balance: "824.5", usdValue: "$12,367.50", price: "$15.00", change: "+2.3%", isPositive: true },
    { symbol: "USDC", balance: "250.00", usdValue: "$250.00", price: "$1.00", change: "0.0%", isPositive: true },
    { symbol: "USDT", balance: "100.00", usdValue: "$100.00", price: "$1.00", change: "0.0%", isPositive: true },
  ];
  
  const transactions = [
    { type: "DEPOSIT", token: "APT", amount: "+100.5", time: "2 hours ago", status: "Confirmed", hash: "0xabc...def" },
    { type: "WITHDRAW", token: "USDC", amount: "-50.0", time: "5 hours ago", status: "Confirmed", hash: "0x123...456" },
    { type: "DEPOSIT", token: "APT", amount: "+200.0", time: "1 day ago", status: "Confirmed", hash: "0x789...abc" },
    { type: "DEPOSIT", token: "USDT", amount: "+100.0", time: "2 days ago", status: "Confirmed", hash: "0xdef...123" },
  ];
  
  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);

  return (
    <div className="min-h-screen bg-background dark">
      <Header isConnected={isConnected} walletAddress={walletAddress} />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </motion.div>
          
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl lg:text-6xl font-bold tracking-wide text-foreground mb-3">
              VAULT
            </h1>
            <p className="text-muted-foreground">
              Securely deposit and withdraw funds for your agents.
            </p>
          </motion.div>
          
          {/* Balance Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className={`rounded-xl border p-6 transition-all cursor-pointer ${
                  selectedToken === token.symbol 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
                onClick={() => setSelectedToken(token.symbol)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <CryptoLogo symbol={token.symbol} size="lg" />
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">Aptos Testnet</p>
                  </div>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground mb-1">
                  {token.balance} {token.symbol}
                </p>
                <p className="text-sm text-muted-foreground">≈ {token.usdValue} USD</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price: {token.price}</span>
                  <span className={token.isPositive ? "text-success" : "text-destructive"}>
                    {token.change}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
          
          {/* Deposit/Withdraw Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Deposit Panel */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground">DEPOSIT FUNDS</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block font-display">Select Currency</label>
                  <div className="flex gap-2">
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token.symbol)}
                        className={`flex-1 py-2 px-4 rounded-lg font-mono text-sm transition-all flex items-center justify-center gap-2 ${
                          selectedToken === token.symbol
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <CryptoLogo symbol={token.symbol} size="sm" />
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block font-display">Enter Amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-mono text-xl h-14 pr-20 bg-muted border-border"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <CryptoLogo symbol={selectedToken} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      Available: {selectedTokenData?.balance} {selectedToken}
                    </span>
                    <div className="flex gap-2">
                      {["25%", "50%", "75%", "MAX"].map((pct) => (
                        <button
                          key={pct}
                          className="px-2 py-1 text-xs font-mono bg-muted rounded hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                        >
                          {pct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Gas</span>
                    <span className="font-mono text-foreground">0.002 APT</span>
                  </div>
                </div>
                
                <Button variant="glow" size="lg" className="w-full font-display tracking-wide font-bold">
                  DEPOSIT TO VAULT
                </Button>
              </div>
            </div>
            
            {/* Withdraw Panel */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 border border-warning/20">
                  <Upload className="h-5 w-5 text-warning" />
                </div>
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground">WITHDRAW FUNDS</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block font-display">Select Currency</label>
                  <div className="flex gap-2">
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token.symbol)}
                        className={`flex-1 py-2 px-4 rounded-lg font-mono text-sm transition-all flex items-center justify-center gap-2 ${
                          selectedToken === token.symbol
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <CryptoLogo symbol={token.symbol} size="sm" />
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block font-display">Enter Amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="font-mono text-xl h-14 pr-20 bg-muted border-border"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <CryptoLogo symbol={selectedToken} size="sm" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vault Balance: {selectedTokenData?.balance} {selectedToken}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Gas</span>
                    <span className="font-mono text-foreground">0.002 APT</span>
                  </div>
                </div>
                
                <Button variant="outline" size="lg" className="w-full font-display tracking-wide font-bold border-warning/50 text-warning hover:bg-warning/10">
                  WITHDRAW FROM VAULT
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-xl font-bold tracking-wide text-foreground">RECENT TRANSACTIONS</h2>
              <div className="flex gap-2">
                {["All", "Deposits", "Withdrawals"].map((tab) => (
                  <button
                    key={tab}
                    className="px-3 py-1.5 text-sm rounded-lg font-mono bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {transactions.map((tx, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tx.type === "DEPOSIT" ? "bg-success/10" : "bg-warning/10"
                    }`}>
                      {tx.type === "DEPOSIT" ? (
                        <Download className="h-5 w-5 text-success" />
                      ) : (
                        <Upload className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <CryptoLogo symbol={tx.token as "APT" | "USDC" | "USDT"} size="sm" />
                      <div>
                        <p className="font-mono font-semibold text-foreground">
                          {tx.amount} {tx.token}
                        </p>
                        <p className="text-sm text-muted-foreground">{tx.time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-success/20 text-success border border-success/30 px-2.5 py-0.5 text-xs font-mono">
                      ✓ {tx.status}
                    </span>
                    <a 
                      href="#" 
                      className="font-mono text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      {tx.hash}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Vault;
