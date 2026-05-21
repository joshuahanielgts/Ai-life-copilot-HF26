import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { defaultData, type LifestyleData } from "@/lib/store";
import {
  calculateBurnout,
  generateTimeline,
  simulateRegret,
  getSmartMission,
  getMoodWeather,
  type BurnoutResult,
  type TimelineEvent,
  type RegretSimulation,
  type DailyMission,
  type MoodWeather,
} from "@/lib/forecastEngine";
import BurnoutRadar from "@/components/forecast/BurnoutRadar";
import LifeReplayTimeline from "@/components/forecast/LifeReplayTimeline";
import RegretSimulator from "@/components/forecast/RegretSimulator";
import SmartDailyMission from "@/components/forecast/SmartDailyMission";
import MoodWeatherCard from "@/components/forecast/MoodWeatherCard";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowRight } from "lucide-react";

interface ForecastState {
  burnout: BurnoutResult;
  timeline: TimelineEvent[];
  simulations: RegretSimulation[];
  mission: DailyMission;
  weather: MoodWeather;
}

function computeForecast(data: LifestyleData): ForecastState {
  return {
    burnout: calculateBurnout(data),
    timeline: generateTimeline(data),
    simulations: ([7, 30, 90] as const).map((h) => simulateRegret(data, h)),
    mission: getSmartMission(data),
    weather: getMoodWeather(data),
  };
}

const STORAGE_KEY = "lifeForecastCache";

const Forecast = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LifestyleData>(defaultData);
  const [forecast, setForecast] = useState<ForecastState | null>(null);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lifestyleData");
    if (!saved) {
      setHasData(false);
      return;
    }
    const parsed: LifestyleData = JSON.parse(saved);
    setData(parsed);

    // Check for cached forecast (same data = skip recompute)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { dataHash, result } = JSON.parse(cached);
      if (dataHash === saved) {
        setForecast(result);
        return;
      }
    }

    const result = computeForecast(parsed);
    setForecast(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dataHash: saved, result }));
  }, []);

  if (!hasData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 pb-24">
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <span className="text-5xl mb-4 block">🔮</span>
          <h2 className="font-display text-xl font-bold mb-2">No Lifestyle Data Yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Log your daily habits first to unlock your AI Life Forecast.
          </p>
          <button className="btn-gradient w-full py-3 rounded-xl flex items-center justify-center gap-2"
            onClick={() => navigate("/input")}>
            Log Today's Habits <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-8 px-4 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display gradient-text">AI Life Forecast</h1>
              <p className="text-muted-foreground text-sm">Predict your future · Prevent burnout · Optimize your life</p>
            </div>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6"
        >
          {/* Row 1: Mission + Weather side by side on large screens */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <SmartDailyMission mission={forecast.mission} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MoodWeatherCard weather={forecast.weather} />
            </motion.div>
          </div>

          {/* Row 2: Burnout Radar full width */}
          <motion.div variants={itemVariants}>
            <BurnoutRadar result={forecast.burnout} />
          </motion.div>

          {/* Row 3: Regret Simulator + Timeline side by side on large screens */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <RegretSimulator simulations={forecast.simulations} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <LifeReplayTimeline events={forecast.timeline} />
            </motion.div>
          </div>

          {/* Footer CTA */}
          <motion.div variants={itemVariants}
            className="glass-card p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <p className="font-semibold">Update your data for a fresh forecast</p>
              <p className="text-sm text-muted-foreground">Forecasts recompute automatically when habits change.</p>
            </div>
            <button
              onClick={() => navigate("/input")}
              className="btn-gradient px-6 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap"
            >
              Log Today's Habits <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Forecast;
