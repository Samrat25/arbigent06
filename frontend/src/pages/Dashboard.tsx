import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Wallet, TrendingUp, Bot, Clock, ArrowRight, 
  Shield, Vault, Activity, ExternalLink 
} from "lucide-react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import CryptoLogo from "@/components/CryptoLogo";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const isConnected = true;
  const walletAddress = "0x1a2b3c4d5e6f7890abcdef1234567890abcd3f4c";
  
  const recentOpportunities = [
    { pair: "APT/USDC", route: "PancakeSwap → Liquidswap", spread: "0.82%", profit: "$42.50", gas: "0.002 APT", risk: "LOW" },
    { pair: "USDC/USDT", route: "Liquidswap → Pontem", spread: "0.45%", profit: "$23.10", gas: "0.001 APT", risk: "LOW" },
    { pair: "APT/USDT", route: "Pontem → PancakeSwap", spread: "0.67%", profit: "$35.80", gas: "0.002 APT", risk: "MED" },
    { pair: "USDC/APT", route: "Cetus → Liquidswap", spread: "0.91%", profit: "$48.20", gas: "0.003 APT", risk: "LOW" },
    { pair: "APT/USDC", route: "Pontem → Cetus", spread: "0.38%", profit: "$19.50", gas: "0.001 APT", risk: "MED" },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "bg-success/20 text-success border-success/30";
      case "MED": return "bg-warning/20 text-warning border-warning/30";
      case "HIGH": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Header isConnected={isConnected} walletAddress={walletAddress} />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-wide text-foreground mb-2">
              DASHBOARD
            </h1>
            <p className="text-muted-foreground">
              Manage your autonomous trading agents.
            </p>
          </motion.div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              icon={Wallet}
              label="Total Vault Balance"
              value="$12,450"
              subValue="APT: 824.5 (-2.73%)"
              delay={0}
            />
            <StatsCard 
              icon={TrendingUp}
              label="Total P/L"
              value="+$342.50"
              subValue="All-time agent performance"
              trend={{ value: "2.83%", isPositive: true }}
              delay={0.1}
            />
            <StatsCard 
              icon={Bot}
              label="Active Agents"
              value="3"
              subValue="2 scanning, 1 executing"
              delay={0.2}
            />
            <StatsCard 
              icon={Activity}
              label="APT Price"
              value="$15.43"
              subValue="24h: +2.3%"
              trend={{ value: "2.3%", isPositive: true }}
              delay={0.3}
            />
          </div>
          
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground">MY ACTIVE AGENTS</h2>
                <div className="flex gap-3">
                  <Button variant="outline" size="default" asChild>
                    <Link to="/vault">
                      <Vault className="h-4 w-4" />
                      Go to Vault
                    </Link>
                  </Button>
                  <Button variant="default" size="default" asChild>
                    <Link to="/agents">
                      + Launch New Agent
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-wide text-foreground mb-2">NO ACTIVE AGENTS</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Deploy your first autonomous trading agent to start capturing arbitrage opportunities across Aptos DEXs.
                </p>
                <Button variant="glow" size="lg" asChild>
                  <Link to="/agents">
                    Launch Your First Agent
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Opportunities Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-wide text-foreground">
                      RECENT ARBITRAGE OPPORTUNITIES
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Live opportunities detected in the last hour
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Pair</th>
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Spread</th>
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Est. Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Gas</th>
                      <th className="px-6 py-3 text-left text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Risk</th>
                      <th className="px-6 py-3 text-right text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentOpportunities.map((opp, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              <CryptoLogo symbol={opp.pair.split('/')[0] as "APT" | "USDC" | "USDT"} size="sm" />
                              <CryptoLogo symbol={opp.pair.split('/')[1] as "APT" | "USDC" | "USDT"} size="sm" />
                            </div>
                            <span className="font-mono font-semibold text-foreground">{opp.pair}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{opp.route}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-success">{opp.spread}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-foreground">{opp.profit}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-muted-foreground">{opp.gas}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono ${getRiskColor(opp.risk)}`}>
                            {opp.risk}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="default" size="sm">Execute</Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Showing 5 of 47 opportunities
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
