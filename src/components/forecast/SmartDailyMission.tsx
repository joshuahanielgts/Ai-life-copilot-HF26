import { motion } from "framer-motion";
import { DailyMission } from "@/lib/forecastEngine";
import { Zap, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  mission: DailyMission;
}

const categoryColors: Record<DailyMission["category"], { ring: string; glow: string; bg: string }> = {
  sleep: { ring: "border-purple-500/40", glow: "shadow-[0_0_20px_hsl(265,80%,60%,0.3)]", bg: "from-purple-500/10 to-transparent" },
  hydration: { ring: "border-cyan-500/40", glow: "shadow-[0_0_20px_hsl(190,90%,50%,0.3)]", bg: "from-cyan-500/10 to-transparent" },
  exercise: { ring: "border-green-500/40", glow: "shadow-[0_0_20px_hsl(150,80%,50%,0.3)]", bg: "from-green-500/10 to-transparent" },
  nutrition: { ring: "border-orange-500/40", glow: "shadow-[0_0_20px_hsl(30,90%,55%,0.3)]", bg: "from-orange-500/10 to-transparent" },
  screen: { ring: "border-red-500/40", glow: "shadow-[0_0_20px_hsl(0,72%,55%,0.3)]", bg: "from-red-500/10 to-transparent" },
  transport: { ring: "border-blue-500/40", glow: "shadow-[0_0_20px_hsl(220,90%,55%,0.3)]", bg: "from-blue-500/10 to-transparent" },
};

export default function SmartDailyMission({ mission }: Props) {
  const [completed, setCompleted] = useState(false);
  const cfg = categoryColors[mission.category];

  return (
    <div className={`glass-card p-6 border ${cfg.ring} ${cfg.glow} relative overflow-hidden`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            <h3 className="font-display font-semibold text-lg">Smart Daily Mission</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">
            Today Only
          </span>
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-4 mb-5"
        >
          <span className="text-5xl leading-none mt-1">{mission.icon}</span>
          <div>
            <p className="text-xl font-bold font-display leading-tight mb-1">{mission.title}</p>
            <p className="text-sm text-muted-foreground">{mission.description}</p>
          </div>
        </motion.div>

        {/* Why it matters */}
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3 mb-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Why this?</span> {mission.why}
          </p>
        </div>

        {/* Impact score */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-muted-foreground">Projected Impact</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${mission.impactScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-bold text-green-400">{mission.impactScore}/100</span>
          </div>
        </div>

        {/* Complete button */}
        <motion.button
          onClick={() => setCompleted((p) => !p)}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            completed
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "btn-gradient"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 size={18} className="text-green-400" />
              Mission Complete! 🎉
            </>
          ) : (
            "Mark as Complete"
          )}
        </motion.button>
      </div>
    </div>
  );
}
