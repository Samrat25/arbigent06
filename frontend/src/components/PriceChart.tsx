import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for the chart
const generateMockData = () => {
  const data = [];
  const basePrice = 15.0;
  let currentPrice = basePrice;
  
  for (let i = 0; i < 24; i++) {
    const change = (Math.random() - 0.48) * 0.5;
    currentPrice = Math.max(14.5, Math.min(16, currentPrice + change));
    data.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: parseFloat(currentPrice.toFixed(2)),
    });
  }
  
  return data;
};

const chartData = generateMockData();
const currentPrice = chartData[chartData.length - 1].price;
const previousPrice = chartData[chartData.length - 2].price;
const priceChange = ((currentPrice - previousPrice) / previousPrice * 100).toFixed(2);
const isPositive = parseFloat(priceChange) >= 0;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const PriceChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-xl tracking-wide text-foreground">APT/USD</span>
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono ${
              isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{priceChange}%
            </div>
          </div>
          <p className="font-mono text-3xl font-bold text-foreground">${currentPrice.toFixed(2)}</p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">24h Range</p>
          <p className="font-mono text-sm text-foreground">$14.89 - $15.67</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 78%, 49%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160, 78%, 49%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 11 }}
              tickMargin={10}
              interval={5}
            />
            <YAxis 
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 11 }}
              tickMargin={10}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(160, 78%, 49%)"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Volume 24h</p>
          <p className="font-mono text-sm font-semibold text-foreground">$234.5M</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
          <p className="font-mono text-sm font-semibold text-foreground">$6.8B</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Circulating</p>
          <p className="font-mono text-sm font-semibold text-foreground">453.4M APT</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceChart;
