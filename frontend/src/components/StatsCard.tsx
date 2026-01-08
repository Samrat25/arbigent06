import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
}

const StatsCard = ({ icon: Icon, label, value, subValue, trend, delay = 0 }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
          {subValue && (
            <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-mono ${
            trend.isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          }`}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
