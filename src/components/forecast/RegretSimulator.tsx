import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RegretSimulation } from "@/lib/forecastEngine";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface Props {
  simulations: RegretSimulation[];
}

const horizonLabels: Record<number, string> = { 7: "7 Days", 30: "30 Days", 90: "90 Days" };

function ScoreBar({ label, current, improved }: { label: string; current: number; improved: number }) {
  const delta = improved - current;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={delta > 0 ? "text-green-400" : "text-red-400"}>
          {delta > 0 ? "+" : ""}{delta}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {/* Current */}
        <motion.div
          className="absolute h-full rounded-full bg-red-500/60"
          initial={{ width: 0 }}
          animate={{ width: `${current}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Improved */}
        <motion.div
          className="absolute h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(265,80%,60%), hsl(150,80%,50%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${improved}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-red-400">{current} (current path)</span>
        <span className="text-green-400">{improved} (improved)</span>
      </div>
    </div>
  );
}

export default function RegretSimulator({ simulations }: Props) {
  const [activeHorizon, setActiveHorizon] = useState<7 | 30 | 90>(30);
  const sim = simulations.find((s) => s.horizon === activeHorizon)!;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={20} className="text-purple-400" />
        <h3 className="font-display font-semibold text-lg">Regret Simulator</h3>
      </div>

      {/* Horizon selector */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-muted/50 border border-border/40">
        {([7, 30, 90] as const).map((h) => (
          <button
            key={h}
            onClick={() => setActiveHorizon(h)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeHorizon === h
                ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(265,80%,60%,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {horizonLabels[h]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeHorizon}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Score comparison bars */}
          <div className="space-y-3">
            <ScoreBar label="Health" current={sim.currentScores.health} improved={sim.improvedScores.health} />
            <ScoreBar label="Productivity" current={sim.currentScores.productivity} improved={sim.improvedScores.productivity} />
            <ScoreBar label="Sustainability" current={sim.currentScores.sustainability} improved={sim.improvedScores.sustainability} />
          </div>

          {/* Outcome cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400">Current Path</span>
              </div>
              <p className="text-sm text-foreground/80">{sim.currentOutcome}</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">Improved Path</span>
              </div>
              <p className="text-sm text-foreground/80">{sim.improvedOutcome}</p>
            </div>
          </div>

          {/* Delta pill */}
          {sim.delta > 0 && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-semibold">
                <TrendingUp size={14} />
                Avg +{sim.delta} pts across all scores in {horizonLabels[activeHorizon]}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
