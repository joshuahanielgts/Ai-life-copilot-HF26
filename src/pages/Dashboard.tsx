import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@/components/CircularProgress";
import { calculateScores, getImprovements, defaultData, SCORE_BREAKDOWNS, type LifestyleData } from "@/lib/store";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, ArrowRight, Heart, Brain, Leaf, BarChart3, Lightbulb, MessageCircle, Settings, Activity, Pill, Telescope, ShieldCheck, Shield, ShieldAlert, AlertTriangle } from "lucide-react";
import MedicineScanner from "@/components/MedicineScanner";

// Build chart data from lifestyle history (falls back to current-day-only data)
function getChartData(currentData: LifestyleData) {
  const raw: Array<{ day: string; data: LifestyleData }> = JSON.parse(localStorage.getItem("lifestyleHistory") || "[]");
  if (raw.length === 0) {
    const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
    raw.push({ day: today, data: currentData });
  }
  const healthTrend = raw.map((h) => ({ day: h.day, score: calculateScores(h.data).health }));
  const stepsVsScreen = raw.map((h) => ({ day: h.day, steps: h.data.steps, screen: h.data.screenTime }));
  const sleepTrend = raw.map((h) => ({ day: h.day, hours: h.data.sleepHours }));
  return { healthTrend, stepsVsScreen, sleepTrend };
}

const mobileGridItems = [
  { icon: Heart, label: "Health Score", color: "text-red-400", section: "scores" },
  { icon: Brain, label: "Productivity", color: "text-primary", section: "scores" },
  { icon: Leaf, label: "Sustainability", color: "text-green-400", section: "scores" },
  { icon: Activity, label: "Lifestyle Logs", color: "text-accent", section: "logs" },
  { icon: Lightbulb, label: "AI Improvements", color: "text-yellow-400", section: "improvements" },
  { icon: BarChart3, label: "Analytics", color: "text-blue-400", section: "analytics" },
  { icon: Pill, label: "Medicine Scan", color: "text-cyan-400", section: "medicine" },
  { icon: MessageCircle, label: "AI Chat Coach", color: "text-purple-400", section: "chat" },
  { icon: Telescope, label: "AI Forecast", color: "text-violet-400", section: "forecast" },
  { icon: Settings, label: "Settings", color: "text-muted-foreground", section: "settings" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LifestyleData>(defaultData);

  useEffect(() => {
    const saved = localStorage.getItem("lifestyleData");
    if (saved) setData(JSON.parse(saved));
  }, []);

  const scores = calculateScores(data);
  const improvements = getImprovements(data);
  const { healthTrend, stepsVsScreen, sleepTrend } = getChartData(data);

  const rawHistory = JSON.parse(localStorage.getItem("lifestyleHistory") || "[]");
  const confidenceLevel = rawHistory.length > 7 ? "High" : rawHistory.length >= 3 ? "Moderate" : "Limited";

  const handleGridClick = (section: string) => {
    if (section === "chat") return navigate("/chat");
    if (section === "logs") return navigate("/input");
    if (section === "forecast") return navigate("/forecast");
    const el = document.getElementById(section);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0 px-4 pt-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-1 gradient-text">AI Life Dashboard</h1>
        <p className="text-muted-foreground mb-8">Your personalized lifestyle analysis</p>

        {/* Mobile Grid - only on small screens */}
        <div className="grid grid-cols-4 gap-3 mb-8 md:hidden">
          {mobileGridItems.map((item) => (
            <button key={item.label} className="mobile-grid-item" onClick={() => handleGridClick(item.section)}>
              <item.icon size={28} className={item.color} />
              <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* AI Life Forecast Banner */}
        <button
          onClick={() => navigate("/forecast")}
          className="w-full mb-8 glass-card p-4 flex items-center gap-4 border border-primary/30 hover:border-primary/60 transition-all duration-200 hover:scale-[1.01] group"
          style={{ background: "linear-gradient(135deg, hsl(265,80%,60%,0.08), hsl(190,90%,50%,0.05))", boxShadow: "0 0 24px hsl(265,80%,60%,0.1)" }}
        >
          <div className="p-3 rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors">
            <Telescope size={24} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-display font-semibold text-sm">✨ AI Life Forecast</p>
            <p className="text-xs text-muted-foreground">Burnout Radar · Life Replay · Regret Sim · Mood Weather</p>
          </div>
          <ArrowRight size={18} className="text-primary/60 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
        </button>

        {/* Scores */}
        <section id="scores" className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> AI Life Scores
            </h2>
            <div className="relative group cursor-help">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium w-fit transition-colors ${
                confidenceLevel === "High" ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20" :
                confidenceLevel === "Moderate" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20" :
                "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              }`}>
                {confidenceLevel === "High" ? <ShieldCheck size={14} /> :
                 confidenceLevel === "Moderate" ? <Shield size={14} /> :
                 <ShieldAlert size={14} />}
                {confidenceLevel} Confidence
              </div>
              
              <div className="absolute top-full right-0 mt-2 w-64 p-3 rounded-lg bg-background/95 backdrop-blur-md shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left scale-95 group-hover:scale-100 origin-top pointer-events-none">
                <p className="text-xs font-semibold mb-1.5 text-foreground/80 border-b border-white/10 pb-1">Analysis Reliability</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {confidenceLevel === "High" ? "The AI has over 7 days of your data, making this analysis highly accurate and deeply personalized." :
                   confidenceLevel === "Moderate" ? "The AI has 3-7 days of your data. Trends are forming, resulting in moderately reliable analysis." :
                   "The AI has less than 3 days of your data. This is a limited snapshot, so recommendations are currently basic."}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CircularProgress value={scores.health} color="green" label="Health Score" description="Based on sleep, water, steps & meals" breakdown={SCORE_BREAKDOWNS.health} />
            <CircularProgress value={scores.productivity} color="blue" label="Productivity Score" description="Based on screen time, sleep & focus" breakdown={SCORE_BREAKDOWNS.productivity} />
            <CircularProgress value={scores.sustainability} color="cyan" label="Sustainability Score" description="Based on transport & consumption" breakdown={SCORE_BREAKDOWNS.sustainability} />
          </div>
        </section>

        {/* Improvements */}
        <section id="improvements" className="mb-10">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-yellow-400" /> AI Recommended Improvements
          </h2>
          <div className="grid gap-3">
            {improvements.map((s, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{s.text}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  s.impact === "High" ? "bg-red-500/20 text-red-400" :
                  s.impact === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"
                }`}>
                  {s.impact}
                </span>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section id="analytics" className="mb-10">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" /> Lifestyle Analytics
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">Daily Health Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,30%,18%)" />
                  <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={12} />
                  <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(230,25%,10%)", border: "1px solid hsl(220,30%,18%)", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(265,80%,60%)" strokeWidth={2} dot={{ fill: "hsl(265,80%,60%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">Steps vs Screen Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stepsVsScreen}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,30%,18%)" />
                  <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={12} />
                  <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(230,25%,10%)", border: "1px solid hsl(220,30%,18%)", borderRadius: "12px" }} />
                  <Bar dataKey="steps" fill="hsl(190,90%,50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5 md:col-span-2">
              <h3 className="font-semibold mb-4">Sleep Quality Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sleepTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,30%,18%)" />
                  <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={12} />
                  <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(230,25%,10%)", border: "1px solid hsl(220,30%,18%)", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="hours" stroke="hsl(45,90%,55%)" strokeWidth={2} dot={{ fill: "hsl(45,90%,55%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* AI Disclaimer Section */}
        <section className="mb-10 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3 text-muted-foreground text-sm">
          <AlertTriangle size={18} className="text-primary/70 shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground/80 font-medium">AI Analysis Disclaimer:</strong> The scores, analytics, and recommendations provided on this dashboard are generated by AI based on your self-reported lifestyle data. They are designed for general wellness tracking and are <strong>not professional medical advice</strong>. Always consult a healthcare provider for medical decisions.
          </p>
        </section>

        {/* Medicine Scanner */}
        <section id="medicine" className="mb-10">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <Pill size={20} className="text-cyan-400" /> Medicine Scanner
          </h2>
          <MedicineScanner />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
