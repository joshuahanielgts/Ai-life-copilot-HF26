import { motion } from "framer-motion";
import { MoodWeather, WeatherType } from "@/lib/forecastEngine";

interface Props {
  weather: MoodWeather;
}

// SVG weather illustrations
const WeatherIllustration = ({ type }: { type: WeatherType }) => {
  switch (type) {
    case "sunny":
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          {/* Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.line key={i}
              x1={48} y1={48}
              x2={48 + Math.cos((deg * Math.PI) / 180) * 38}
              y2={48 + Math.sin((deg * Math.PI) / 180) * 38}
              stroke="hsl(45,90%,60%)" strokeWidth="3" strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            />
          ))}
          <motion.circle cx="48" cy="48" r="22" fill="hsl(45,90%,55%)"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            style={{ filter: "drop-shadow(0 0 16px hsl(45,90%,55%))" }} />
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <motion.circle cx="34" cy="40" r="18" fill="hsl(45,90%,55%)"
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            style={{ filter: "drop-shadow(0 0 10px hsl(45,90%,55%))" }} />
          <motion.rect x="14" y="50" width="52" height="22" rx="11" fill="hsl(215,30%,65%)"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ filter: "drop-shadow(0 4px 12px hsl(215,30%,40%,0.4))" }} />
        </svg>
      );
    case "cloudy":
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <motion.rect x="8" y="38" width="60" height="24" rx="12" fill="hsl(215,20%,50%)"
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} />
          <motion.rect x="24" y="30" width="56" height="28" rx="14" fill="hsl(215,20%,60%)"
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ filter: "drop-shadow(0 4px 10px hsl(215,25%,35%,0.5))" }} />
        </svg>
      );
    case "rainy":
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <motion.rect x="14" y="22" width="60" height="28" rx="14" fill="hsl(240,30%,50%)"
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} />
          {[24, 38, 52, 66].map((x, i) => (
            <motion.line key={i} x1={x} y1="58" x2={x - 6} y2="76"
              stroke="hsl(200,70%,60%)" strokeWidth="2.5" strokeLinecap="round"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
            />
          ))}
        </svg>
      );
    case "stormy":
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <motion.rect x="8" y="16" width="68" height="28" rx="14" fill="hsl(240,20%,35%)"
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} />
          {[20, 40, 60].map((x, i) => (
            <motion.line key={i} x1={x} y1="52" x2={x - 8} y2="76"
              stroke="hsl(215,25%,55%)" strokeWidth="2.5" strokeLinecap="round"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.8 }}
            />
          ))}
          {/* Lightning */}
          <motion.polyline points="50,44 43,60 49,60 42,76" fill="none"
            stroke="hsl(45,95%,60%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1, 0] }}
            transition={{ delay: 0.5, repeat: Infinity, duration: 1.5 }}
            style={{ filter: "drop-shadow(0 0 8px hsl(45,95%,60%))" }}
          />
        </svg>
      );
  }
};

const weatherBg: Record<WeatherType, string> = {
  sunny: "from-yellow-500/10 via-transparent to-transparent",
  "partly-cloudy": "from-blue-400/10 via-transparent to-transparent",
  cloudy: "from-slate-500/10 via-transparent to-transparent",
  rainy: "from-indigo-500/10 via-transparent to-transparent",
  stormy: "from-red-500/10 via-transparent to-transparent",
};

export default function MoodWeatherCard({ weather }: Props) {
  return (
    <div className={`glass-card p-6 relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${weatherBg[weather.weather]} pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🌍</span>
          <h3 className="font-display font-semibold text-lg">Mood Weather</h3>
          <span className="ml-auto text-xs text-muted-foreground">Today's Climate</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Illustration */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            <WeatherIllustration type={weather.weather} />
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            <motion.p
              className={`text-3xl font-bold font-display mb-1 ${weather.color}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ textShadow: `0 0 20px ${weather.glowColor}` }}
            >
              {weather.emoji} {weather.label}
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {weather.description}
            </motion.p>
          </div>
        </div>

        {/* Weather scale */}
        <div className="mt-5 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>⛈️ Stormy</span>
            <span>Your Climate</span>
            <span>☀️ Sunny</span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden"
            style={{ background: "linear-gradient(90deg, hsl(0,72%,45%), hsl(240,50%,50%), hsl(200,60%,55%), hsl(45,80%,50%), hsl(150,70%,50%))" }}>
            {/* Indicator */}
            {(() => {
              const positions: Record<WeatherType, number> = { stormy: 5, rainy: 25, cloudy: 48, "partly-cloudy": 70, sunny: 92 };
              return (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-white/80 shadow-lg"
                  initial={{ left: "48%" }}
                  animate={{ left: `${positions[weather.weather]}%` }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.5 }}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
