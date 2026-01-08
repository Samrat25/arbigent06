import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Menu, X, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isConnected?: boolean;
  walletAddress?: string;
  onConnect?: () => void;
}

const Header = ({ isConnected = false, walletAddress, onConnect }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/vault", label: "Vault" },
    { href: "/agents", label: "Agents" },
  ];
  
  const isLanding = location.pathname === "/";
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary transition-colors">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-wide text-foreground">ARBIGENT</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Agentic Arbitrage</span>
          </div>
        </Link>
        
        {/* Network Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5">
          <Radio className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-xs font-display text-primary">APTOS TESTNET</span>
        </div>
        
        {/* Desktop Navigation */}
        {!isLanding && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-display text-sm tracking-wide transition-colors hover:text-primary ${
                  location.pathname === link.href 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        
        {/* Wallet Button */}
        <div className="flex items-center gap-4">
          {isConnected && walletAddress ? (
            <Button variant="wallet" size="default" className="hidden sm:flex">
              <Wallet className="h-4 w-4 text-primary" />
              {truncateAddress(walletAddress)}
            </Button>
          ) : (
            <Button variant="wallet" size="default" onClick={onConnect} className="hidden sm:flex">
              <Wallet className="h-4 w-4 text-primary" />
              Connect Petra Wallet
            </Button>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-border bg-background"
        >
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            {/* Mobile Network Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 w-fit">
              <Radio className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-xs font-display text-primary">APTOS TESTNET</span>
            </div>
            
            {!isLanding && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-display text-lg tracking-wide transition-colors hover:text-primary ${
                  location.pathname === link.href 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="wallet" size="lg" onClick={onConnect} className="mt-4">
              <Wallet className="h-4 w-4 text-primary" />
              {isConnected ? truncateAddress(walletAddress || "") : "Connect Wallet"}
            </Button>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
