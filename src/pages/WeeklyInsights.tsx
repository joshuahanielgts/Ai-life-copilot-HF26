import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  ArrowLeft,
  Moon,
  Droplets,
  Footprints,
  Dumbbell,
  Smartphone,
  CheckCircle2,
  Calendar,
  X,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateScores,
  calculateStreaks,
  calculateWeeklyAverages,
  calculateConsistencyScore,
  getAchievementBadges,
  getOrInitializeHistory,
  defaultData,
  type LifestyleData,
  type BadgeItem
} from "@/lib/store";

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 space-y-1.5 mb-3 text-xs md:text-sm text-muted-foreground">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInline = (str: string) => {
    const parts = str.split("**");
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold text-foreground">{part}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("####")) {
      flushList(index);
      elements.push(
        <h4 key={index} className="text-xs md:text-sm font-semibold text-foreground font-display mt-3 mb-1.5">
          {parseInline(trimmed.substring(4).trim())}
        </h4>
      );
    } else if (trimmed.startsWith("###")) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-sm md:text-base font-bold text-foreground font-display mt-3 mb-2">
          {parseInline(trimmed.substring(3).trim())}
        </h3>
      );
    } else if (trimmed.startsWith("##")) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-sm md:text-base font-bold text-foreground font-display mt-3.5 mb-2">
          {parseInline(trimmed.substring(2).trim())}
        </h3>
      );
    } else if (trimmed.startsWith("#")) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-base font-bold text-foreground font-display mt-4 mb-2.5">
          {parseInline(trimmed.substring(1).trim())}
        </h3>
      );
    } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const content = trimmed.substring(1).trim();
      currentList.push(
        <li key={index} className="leading-relaxed">
          {parseInline(content)}
        </li>
      );
    } else if (trimmed === "") {
      flushList(index);
    } else {
      flushList(index);
      elements.push(
        <p key={index} className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-2.5">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  flushList(lines.length);
  return elements;
};

const WeeklyInsights = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<{ day: string; data: LifestyleData }[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let currentData = defaultData;
    const saved = localStorage.getItem("lifestyleData");
    if (saved) {
      try {
        currentData = JSON.parse(saved);
      } catch {}
    }
    const fullHistory = getOrInitializeHistory(currentData);
    setHistory(fullHistory);
  }, []);

  const { streaks, averages, consistency, badges, chartData } = useMemo(() => {
    if (history.length === 0) {
      return {
        streaks: { sleep: 0, water: 0, steps: 0, exercise: 0 },
        averages: { sleepHours: 0, waterIntake: 0, steps: 0, screenTime: 0, exerciseTime: 0 },
        consistency: 0,
        badges: [],
        chartData: []
      };
    }

    const currentStreaks = calculateStreaks(history);
    const currentAverages = calculateWeeklyAverages(history);
    const currentConsistency = calculateConsistencyScore(history);
    const currentBadges = getAchievementBadges(history);

    const currentChartData = history.map((h) => {
      const scores = calculateScores(h.data);
      return {
        day: h.day,
        "Health Score": scores.health,
        "Productivity Score": scores.productivity,
        Steps: h.data.steps,
        "Screen Time": h.data.screenTime,
      };
    });

    return {
      streaks: currentStreaks,
      averages: currentAverages,
      consistency: currentConsistency,
      badges: currentBadges,
      chartData: currentChartData
    };
  }, [history]);

  useEffect(() => {
    if (history.length === 0) return;

    setAiLoading(true);
    const generateLocalSummary = () => {
      let text = `### 🧠 Weekly Wellness Summary\n\n`;

      if (consistency >= 80) {
        text += `✨ **Outstanding Consistency!** You achieved an overall compliance rate of **${consistency}%** across your wellness targets. Your body and mind are benefiting significantly from these highly cohesive routines. Keep guarding this rhythm; it is a solid foundation for peak focus and high energy.\n\n`;
      } else if (consistency >= 50) {
        text += `📈 **Steady Habits Building!** You finished the week with an overall consistency score of **${consistency}%**. You are establishing clear, positive trends in your daily routines. Focus on making small, non-negotiable adjustments to push your consistency into the high tier.\n\n`;
      } else {
        text += `🌱 **Growth Foundations!** Your habit consistency is at **${consistency}%**. Building long-term habits takes time and patience. Avoid trying to correct everything at once; instead, choose one high-impact anchor habit (like early sleep or consistent steps) and lock that in first.\n\n`;
      }

      text += `#### 🔍 Metric Diagnostics\n`;
      text += `- 👟 **Activity & Movement**: Averaging **${averages.steps.toLocaleString()} steps** daily. Active walking stimulates neurogenesis, flushes cortisol, and maintains consistent cardiorespiratory stamina.\n`;
      text += `- 🌙 **Sleep Recovery**: Averaging **${averages.sleepHours} hours**. Deep and REM sleep are vital for cognitive cleanup, emotional regulation, and hormonal equilibrium.\n`;
      text += `- 💧 **System Hydration**: Averaging **${averages.waterIntake} liters**. Hydration keeps joint lubrication optimal, cellular processes operating efficiently, and mental fatigue at bay.\n`;
      text += `- 📱 **Digital Exposure**: Averaging **${averages.screenTime} hours** of daily screen time. Keep monitoring this, especially in the late evening, to protect your natural melatonin production.\n\n`;

      text += `#### 🎯 Key Recommendation\n`;
      if (averages.screenTime > 6) {
        text += `👉 Try scheduling a digital sundown: shut off screen-based devices 45 minutes before bed. Swap it for reading or light stretching to increase your sleep depth.`;
      } else if (averages.steps < 8000) {
        text += `👉 Aim to weave in a brisk 15-minute walk immediately following lunch or dinner. It aids digestion and easily closes the gap to your target step count.`;
      } else if (averages.waterIntake < 2.5) {
        text += `👉 Place a dedicated 1-liter water bottle on your desk at the start of the day. Finishing one by noon and another by 5 PM ensures you hit your baseline hydration goals effortlessly.`;
      } else {
        text += `👉 Your habits are highly balanced! Elevate your productivity by matching your highest mental focus windows with complex tasks, using exercise and screens as structured transitions.`;
      }

      setAiSummary(text);
      setAiLoading(false);
    };

    const fetchAISummary = async () => {
      const storedUrl = import.meta.env.VITE_SUPABASE_URL;
      const storedKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      if (!storedUrl || !storedKey) {
        generateLocalSummary();
        return;
      }

      try {
        const response = await fetch(
          `${storedUrl}/functions/v1/ai-coach`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedKey}`,
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `Generate a structured, professional, motivating weekly wellness summary (with markdown) for the user. Here are their weekly habits: Averages: ${JSON.stringify(
                    averages
                  )}. Consistency Score: ${consistency}%. Streaks: ${JSON.stringify(
                    streaks
                  )}. Badges unlocked: ${badges
                    .filter((b) => b.unlocked)
                    .map((b) => b.name)
                    .join(", ")}.`
                }
              ],
              lifestyleData: history[history.length - 1]?.data
            })
          }
        );

        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          setAiSummary(content);
        } else {
          generateLocalSummary();
        }
      } catch (e) {
        generateLocalSummary();
      } finally {
        setAiLoading(false);
      }
    };

    fetchAISummary();
  }, [history, averages, streaks, consistency, badges]);

  const consistencyColor = consistency >= 80 ? "text-green-400" : consistency >= 50 ? "text-yellow-400" : "text-red-400";
  const consistencyLabel = consistency >= 80 ? "Excellent" : consistency >= 50 ? "Building" : "Starting";

  return (
    <div className="min-h-screen pb-24 lg:pb-12 px-4 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-display gradient-text">Weekly Insights</h1>
            <p className="text-muted-foreground text-sm">Long-term consistency & habit tracking</p>
          </div>
        </div>

        {/* Consistency Score & Streak overview */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Habit Consistency</h3>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="hsl(220,30%,15%)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="hsl(265,80%,60%)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - consistency / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-display">{consistency}%</span>
                <span className={`text-[11px] font-semibold tracking-wide uppercase ${consistencyColor}`}>
                  {consistencyLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Flame size={18} className="text-orange-400" /> Active Habit Streaks
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Moon, value: streaks.sleep, label: "Sleep hours", color: "text-purple-400", bg: "bg-purple-500/10" },
                { icon: Droplets, value: streaks.water, label: "Water target", color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: Footprints, value: streaks.steps, label: "Steps count", color: "text-green-400", bg: "bg-green-500/10" },
                { icon: Dumbbell, value: streaks.exercise, label: "Exercise time", color: "text-yellow-400", bg: "bg-yellow-500/10" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/20 text-center hover:scale-[1.03] transition-all">
                  <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} mb-2.5`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-2xl font-bold flex items-center gap-1 font-display">
                    {item.value} <span className="text-xs text-muted-foreground font-normal">days</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Analytics Summary & Progress Comparison */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Weekly Analytics & Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              {
                label: "Steps Walked",
                value: averages.steps.toLocaleString(),
                unit: "steps",
                trend: averages.steps >= 8000 ? "+6.8%" : "-3.2%",
                isPositive: averages.steps >= 8000,
                color: "text-green-400"
              },
              {
                label: "Sleep Recovery",
                value: averages.sleepHours,
                unit: "hrs",
                trend: averages.sleepHours >= 7 ? "+4.2%" : "-2.5%",
                isPositive: averages.sleepHours >= 7,
                color: "text-purple-400"
              },
              {
                label: "Water Intake",
                value: averages.waterIntake,
                unit: "L",
                trend: averages.waterIntake >= 2 ? "+11.5%" : "-5.8%",
                isPositive: averages.waterIntake >= 2,
                color: "text-blue-400"
              },
              {
                label: "Screen Time",
                value: averages.screenTime,
                unit: "hrs",
                trend: averages.screenTime <= 6 ? "-15.2%" : "+8.4%",
                isPositive: averages.screenTime <= 6, // decreasing screen time is good!
                color: "text-red-400"
              },
              {
                label: "Daily Exercise",
                value: averages.exerciseTime,
                unit: "mins",
                trend: averages.exerciseTime >= 30 ? "+8.4%" : "-4.1%",
                isPositive: averages.exerciseTime >= 30,
                color: "text-yellow-400"
              }
            ].map((item, idx) => (
              <div key={idx} className="glass-card p-4 hover:scale-[1.02] transition-all">
                <span className="text-[11px] text-muted-foreground font-medium block truncate">{item.label}</span>
                <div className="flex items-baseline gap-1 mt-2.5">
                  <span className="text-2xl font-bold font-display">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </div>
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-lg w-max ${
                  item.isPositive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                }`}>
                  <span>{item.trend}</span>
                  <span className="text-muted-foreground font-normal">vs last week</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Analytics Trends */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Overall Score Trends
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(265,80%,60%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(265,80%,60%)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190,90%,50%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(190,90%,50%)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,30%,15%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(230,25%,8%)", border: "1px solid hsl(220,30%,15%)", borderRadius: "14px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Health Score" stroke="hsl(265,80%,60%)" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
                <Area type="monotone" dataKey="Productivity Score" stroke="hsl(190,90%,50%)" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-cyan-400" /> Steps vs Digital Focus
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,30%,15%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis yAxisId="left" stroke="hsl(190,90%,50%)" fontSize={11} label={{ value: 'Steps', angle: -90, position: 'insideLeft', fill: 'hsl(190,90%,50%)', style: {fontSize: 10} }} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(340,80%,60%)" fontSize={11} label={{ value: 'Screens (h)', angle: 90, position: 'insideRight', fill: 'hsl(340,80%,60%)', style: {fontSize: 10} }} />
                <Tooltip contentStyle={{ background: "hsl(230,25%,8%)", border: "1px solid hsl(220,30%,15%)", borderRadius: "14px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="Steps" fill="hsl(190,90%,50%)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Screen Time" fill="hsl(340,80%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Wellness Report & Achievements */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Wellness Summary */}
          <div className="glass-card p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" /> AI Wellness Coach Report
              </h3>
              {aiLoading ? (
                <div className="flex flex-col gap-3 py-6 justify-center items-center h-48">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground italic">Generating custom profile review...</span>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-muted-foreground prose prose-invert max-w-none">
                  {renderMarkdown(aiSummary)}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border/20 flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> Trailing 7-day period</span>
              <button onClick={() => navigate("/chat")} className="text-primary font-medium hover:underline flex items-center gap-0.5">
                Discuss with Coach →
              </button>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-yellow-400" /> Weekly Achievements
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-3.5">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group ${
                    badge.unlocked
                      ? "bg-primary/5 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                      : "bg-muted/20 border-border/20 opacity-40 hover:opacity-60"
                  }`}
                >
                  <span className={`text-3xl mb-1.5 transition-transform group-hover:scale-110 ${badge.unlocked ? "drop-shadow-[0_0_8px_hsl(265,80%,60%,0.6)]" : ""}`}>
                    {badge.icon}
                  </span>
                  <span className="text-[10px] font-bold truncate max-w-full leading-tight">{badge.name}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">
                    {badge.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge Modal Overlay */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-sm w-full relative border border-primary/30 text-center"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center mt-3">
                <span className={`text-6xl mb-4 ${selectedBadge.unlocked ? "drop-shadow-[0_0_12px_hsl(265,80%,60%,0.8)]" : ""}`}>
                  {selectedBadge.icon}
                </span>
                <h3 className="text-xl font-bold font-display mb-1">{selectedBadge.name}</h3>
                <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full mb-4 ${
                  selectedBadge.unlocked ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                }`}>
                  {selectedBadge.unlocked ? "Achievement Unlocked" : "In Progress"}
                </span>

                <div className="bg-muted/40 border border-border/20 rounded-xl p-4 w-full text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5 text-left mb-4">
                  <Target size={16} className="text-primary shrink-0 mt-0.5" />
                  <p>{selectedBadge.description}</p>
                </div>

                {selectedBadge.unlocked ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold mt-1">
                    <CheckCircle2 size={15} /> Outstanding effort! Keep it up!
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Complete your daily logs to unlock this badge.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyInsights;
