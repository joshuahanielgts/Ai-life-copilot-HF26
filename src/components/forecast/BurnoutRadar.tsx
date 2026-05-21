import { motion } from "framer-motion";
import { BurnoutResult, RiskLevel } from "@/lib/forecastEngine";
import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface Props {
  result: BurnoutResult;
}

const riskConfig: Record<RiskLevel, { color: string; glow: string; bg: string; Icon: typeof AlertTriangle }> = {
  Low: { color: "hsl(150,80%,50%)", glow: "0 0 24px hsl(150,80%,50%,0.4)", bg: "bg-green-500/10 text-green-400 border-green-500/30", Icon: ShieldCheck },
  Medium: { color: "hsl(45,90%,55%)", glow: "0 0 24px hsl(45,90%,55%,0.4)", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", Icon: Zap },
  High: { color: "hsl(0,72%,55%)", glow: "0 0 24px hsl(0,72%,55%,0.4)", bg: "bg-red-500/10 text-red-400 border-red-500/30", Icon: AlertTriangle },
};

export default function BurnoutRadar({ result }: Props) {
  const { color, glow, bg, Icon } = riskConfig[result.level];
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle size={20} className="text-orange-400" />
        <h3 className="font-display font-semibold text-lg">Burnout Radar</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        {/* Gauge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
              <defs>
                <filter id="burnout-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={color} floodOpacity="0.7" />
                </filter>
              </defs>
              {/* Track */}
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="hsl(220,30%,18%)" strokeWidth={strokeWidth} />
              {/* Progress */}
              <motion.circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="round"
                filter="url(#burnout-glow)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-3xl font-bold font-display" style={{ color }}>{result.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          {/* Risk badge */}
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${bg} flex items-center gap-1.5`}
            style={{ boxShadow: glow }}>
            <Icon size={14} />
            {result.level} Risk
          </span>
        </div>

        {/* Factors */}
        <div className="flex-1 w-full space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{result.summary}</p>
          {result.factors.map((f, i) => (
            <motion.div key={f.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{f.icon}</span>
                  <span className="text-foreground/80">{f.label}</span>
                </span>
                <span className="font-semibold text-xs" style={{ color }}>+{f.contribution}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, opacity: 0.8 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.contribution / 35) * 100}%` }}
                  transition={{ delay: i * 0.1 + 0.4, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
