import { motion } from "framer-motion";
import { TimelineEvent } from "@/lib/forecastEngine";
import { Clock } from "lucide-react";

interface Props {
  events: TimelineEvent[];
}

const typeConfig = {
  peak: { dot: "bg-green-500", glow: "shadow-[0_0_10px_hsl(150,80%,50%,0.6)]", label: "bg-green-500/10 text-green-400 border-green-500/20" },
  unhealthy: { dot: "bg-red-500", glow: "shadow-[0_0_10px_hsl(0,72%,55%,0.6)]", label: "bg-red-500/10 text-red-400 border-red-500/20" },
  neutral: { dot: "bg-yellow-500", glow: "shadow-[0_0_10px_hsl(45,90%,55%,0.5)]", label: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  habit: { dot: "bg-primary", glow: "shadow-[0_0_10px_hsl(265,80%,60%,0.5)]", label: "bg-primary/10 text-primary border-primary/20" },
};

export default function LifeReplayTimeline({ events }: Props) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} className="text-accent" />
        <h3 className="font-display font-semibold text-lg">Life Replay Timeline</h3>
        <span className="ml-auto text-xs text-muted-foreground">Today's Breakdown</span>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-border/50 to-transparent" />

        <div className="space-y-4">
          {events.map((event, i) => {
            const cfg = typeConfig[event.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 pl-1"
              >
                {/* Dot */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.dot} ${cfg.glow} bg-opacity-20`}
                  style={{ background: "hsl(var(--card))" }}>
                  <span className={`w-3 h-3 rounded-full ${cfg.dot} ${cfg.glow}`} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">{event.time}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.label}`}>
                      {event.type === "peak" ? "Peak" : event.type === "unhealthy" ? "Unhealthy" : event.type === "habit" ? "Habit" : "Neutral"}
                    </span>
                  </div>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <span>{event.icon}</span> {event.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/40">
        {(["peak", "unhealthy", "habit", "neutral"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${typeConfig[type].dot}`} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
