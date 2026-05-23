import { useEffect, useState } from "react";
import { Info } from "lucide-react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  description: string;
  breakdown?: { factor: string; weight: string }[];
}

const CircularProgress = ({ value, max = 100, size = 140, strokeWidth = 10, color, label, description, breakdown }: CircularProgressProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / max) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = () => {
    if (value >= 70) return "hsl(150, 80%, 50%)";
    if (value >= 40) return "hsl(45, 90%, 55%)";
    return "hsl(0, 72%, 51%)";
  };

  return (
    <div className="score-card">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ overflow: 'visible' }}>
          <defs>
            <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={getColor()} floodOpacity="0.6" />
            </filter>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter={`url(#glow-${label})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-display" style={{ color: getColor() }}>{animatedValue}</span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4 mb-1">
        <h3 className="font-display font-semibold text-lg">{label}</h3>
        {breakdown && (
          <div className="relative group">
            <Info size={16} className="text-muted-foreground cursor-help hover:text-primary transition-colors outline-none focus:outline-none" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-lg bg-background/95 backdrop-blur-md shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left scale-95 group-hover:scale-100 origin-bottom pointer-events-none">
              <p className="text-xs font-semibold mb-2 text-foreground/80 border-b border-white/10 pb-1">Calculation Breakdown</p>
              <div className="space-y-1.5">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{item.factor}</span>
                    <span className="font-medium text-foreground">{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
};

export default CircularProgress;
