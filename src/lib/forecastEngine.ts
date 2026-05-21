import { LifestyleData, calculateScores, getImprovements } from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "Low" | "Medium" | "High";

export interface BurnoutResult {
  score: number; // 0–100 (higher = worse)
  level: RiskLevel;
  factors: { label: string; contribution: number; icon: string }[];
  summary: string;
}

export interface TimelineEvent {
  time: string;
  type: "peak" | "unhealthy" | "neutral" | "habit";
  label: string;
  icon: string;
  detail: string;
}

export interface RegretSimulation {
  horizon: 7 | 30 | 90;
  currentScores: { health: number; productivity: number; sustainability: number };
  improvedScores: { health: number; productivity: number; sustainability: number };
  currentOutcome: string;
  improvedOutcome: string;
  delta: number; // avg improvement
}

export interface DailyMission {
  icon: string;
  title: string;
  description: string;
  category: "sleep" | "hydration" | "exercise" | "nutrition" | "screen" | "transport";
  impactScore: number;
  why: string;
}

export type WeatherType = "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy";

export interface MoodWeather {
  weather: WeatherType;
  label: string;
  description: string;
  emoji: string;
  color: string;
  glowColor: string;
}

// ─── Burnout Radar ────────────────────────────────────────────────────────────

export function calculateBurnout(data: LifestyleData): BurnoutResult {
  const factors: { label: string; contribution: number; icon: string }[] = [];

  // Sleep deprivation (max +35)
  const sleepDeficit = Math.max(0, 8 - data.sleepHours);
  const sleepContrib = Math.min(35, sleepDeficit * 5.5);
  factors.push({ label: "Sleep Deprivation", contribution: Math.round(sleepContrib), icon: "🌙" });

  // Screen time overload (max +25)
  const screenExcess = Math.max(0, data.screenTime - 4);
  const screenContrib = Math.min(25, screenExcess * 2.5);
  factors.push({ label: "Screen Time Overload", contribution: Math.round(screenContrib), icon: "📱" });

  // Dehydration (max +15)
  const waterDeficit = Math.max(0, 3 - data.waterIntake);
  const waterContrib = Math.min(15, waterDeficit * 5);
  factors.push({ label: "Dehydration", contribution: Math.round(waterContrib), icon: "💧" });

  // Physical inactivity (max +15)
  const exerciseDeficit = Math.max(0, 30 - data.exerciseTime);
  const exerciseContrib = Math.min(15, (exerciseDeficit / 30) * 15);
  factors.push({ label: "Physical Inactivity", contribution: Math.round(exerciseContrib), icon: "🏃" });

  // Poor nutrition (max +10)
  const mealContrib = data.mealsType === "fastfood" ? 10 : data.mealsType === "mixed" ? 4 : 0;
  factors.push({ label: "Poor Nutrition", contribution: mealContrib, icon: "🥗" });

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.contribution, 0));
  const level: RiskLevel = score >= 65 ? "High" : score >= 35 ? "Medium" : "Low";

  const summaries: Record<RiskLevel, string> = {
    Low: "You're in great shape! Your habits are supporting resilience.",
    Medium: "Some stress signals detected. Address the top factors to prevent escalation.",
    High: "Critical burnout risk. Immediate lifestyle adjustments are needed.",
  };

  // Sort factors by contribution descending
  factors.sort((a, b) => b.contribution - a.contribution);

  return { score, level, factors, summary: summaries[level] };
}

// ─── Life Replay Timeline ─────────────────────────────────────────────────────

export function generateTimeline(data: LifestyleData): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Morning routine
  const wakeHour = Math.max(5, 24 - Math.round(data.sleepHours));
  events.push({
    time: `${wakeHour}:00 AM`,
    type: data.sleepHours >= 7 ? "peak" : "unhealthy",
    label: data.sleepHours >= 7 ? "Energised Wake-Up" : "Tired Wake-Up",
    icon: data.sleepHours >= 7 ? "☀️" : "😴",
    detail: `${data.sleepHours}h sleep — ${data.sleepHours >= 7 ? "well rested" : "below optimal 7–8h"}`,
  });

  // Breakfast / Meal
  events.push({
    time: "8:00 AM",
    type: data.mealsType === "healthy" ? "peak" : data.mealsType === "mixed" ? "neutral" : "unhealthy",
    label: data.mealsType === "healthy" ? "Healthy Breakfast" : data.mealsType === "mixed" ? "Mixed Breakfast" : "Fast Food Breakfast",
    icon: data.mealsType === "healthy" ? "🥣" : data.mealsType === "mixed" ? "🥐" : "🍔",
    detail: `Meal type: ${data.mealsType}`,
  });

  // Hydration check
  events.push({
    time: "10:00 AM",
    type: data.waterIntake >= 2 ? "habit" : "unhealthy",
    label: data.waterIntake >= 2 ? "Hydration Goal On Track" : "Low Water Intake",
    icon: "💧",
    detail: `${data.waterIntake}L of target 3L consumed`,
  });

  // Exercise / Steps
  const stepsPeak = data.steps >= 7000;
  events.push({
    time: "12:00 PM",
    type: data.exerciseTime >= 30 ? "peak" : stepsPeak ? "neutral" : "unhealthy",
    label: data.exerciseTime >= 30 ? "Workout Complete" : data.steps >= 5000 ? "Light Activity" : "Sedentary Period",
    icon: data.exerciseTime >= 30 ? "💪" : data.steps >= 5000 ? "🚶" : "🪑",
    detail: `${data.exerciseTime} min exercise · ${data.steps.toLocaleString()} steps`,
  });

  // Afternoon screen time
  events.push({
    time: "3:00 PM",
    type: data.screenTime > 8 ? "unhealthy" : data.screenTime > 5 ? "neutral" : "peak",
    label: data.screenTime > 8 ? "Screen Time Overload" : data.screenTime > 5 ? "Moderate Screen Use" : "Healthy Screen Balance",
    icon: data.screenTime > 8 ? "📵" : "💻",
    detail: `${data.screenTime}h of screen time today`,
  });

  // Evening wind-down
  events.push({
    time: "7:00 PM",
    type: "habit",
    label: "Evening Routine",
    icon: "🌆",
    detail: `Transport: ${data.transportType} · Meals: ${data.mealsType}`,
  });

  // Sleep readiness
  const goodSleep = data.sleepHours >= 7 && data.screenTime <= 6;
  events.push({
    time: "10:00 PM",
    type: goodSleep ? "peak" : "unhealthy",
    label: goodSleep ? "Ready for Deep Sleep" : "Poor Sleep Conditions",
    icon: goodSleep ? "🌙" : "⚠️",
    detail: goodSleep ? "Good sleep hygiene detected" : "High screen time may delay sleep onset",
  });

  return events;
}

// ─── Regret Simulator ─────────────────────────────────────────────────────────

function projectScores(
  base: { health: number; productivity: number; sustainability: number },
  delta: { health: number; productivity: number; sustainability: number },
  days: number
): { health: number; productivity: number; sustainability: number } {
  // Compound improvement with diminishing returns
  const factor = 1 - Math.exp(-days / 60);
  return {
    health: Math.min(100, Math.round(base.health + delta.health * factor * 1.5)),
    productivity: Math.min(100, Math.round(base.productivity + delta.productivity * factor * 1.5)),
    sustainability: Math.min(100, Math.round(base.sustainability + delta.sustainability * factor * 1.5)),
  };
}

function projectDecline(
  base: { health: number; productivity: number; sustainability: number },
  days: number
): { health: number; productivity: number; sustainability: number } {
  const factor = Math.min(0.4, days * 0.004);
  return {
    health: Math.max(0, Math.round(base.health * (1 - factor))),
    productivity: Math.max(0, Math.round(base.productivity * (1 - factor))),
    sustainability: Math.max(0, Math.round(base.sustainability * (1 - factor))),
  };
}

export function simulateRegret(data: LifestyleData, horizon: 7 | 30 | 90): RegretSimulation {
  const current = calculateScores(data);
  const improvements = getImprovements(data);

  // Build ideal data
  const idealData: LifestyleData = {
    sleepHours: Math.max(data.sleepHours, 7.5),
    waterIntake: Math.max(data.waterIntake, 3),
    steps: Math.max(data.steps, 10000),
    mealsType: data.mealsType === "fastfood" ? "mixed" : data.mealsType,
    screenTime: Math.min(data.screenTime, 5),
    exerciseTime: Math.max(data.exerciseTime, 45),
    transportType: data.transportType === "car" ? "public" : data.transportType,
  };

  const idealCurrent = calculateScores(idealData);
  const delta = {
    health: idealCurrent.health - current.health,
    productivity: idealCurrent.productivity - current.productivity,
    sustainability: idealCurrent.sustainability - current.sustainability,
  };

  const hasHighImpact = improvements.some((i) => i.impact === "High");
  const currentProjected = hasHighImpact
    ? projectDecline(current, horizon)
    : { health: current.health, productivity: current.productivity, sustainability: current.sustainability };

  const improvedProjected = projectScores(current, delta, horizon);

  const avgDelta = Math.round(
    ((improvedProjected.health - currentProjected.health) +
      (improvedProjected.productivity - currentProjected.productivity) +
      (improvedProjected.sustainability - currentProjected.sustainability)) / 3
  );

  const outcomeMap: Record<number, { current: string; improved: string }> = {
    7: {
      current: hasHighImpact ? "Fatigue may build. Energy levels dip." : "Stable trajectory maintained.",
      improved: "Noticeable energy boost, better focus cycles.",
    },
    30: {
      current: hasHighImpact ? "Risk of chronic fatigue and mood drops." : "Minor plateaus possible.",
      improved: "Significant health gains, improved sleep quality & mental clarity.",
    },
    90: {
      current: hasHighImpact ? "Burnout or illness risk increases substantially." : "Gradual decline without habit changes.",
      improved: "Transformative lifestyle shift — peak performance state achievable.",
    },
  };

  return {
    horizon,
    currentScores: currentProjected,
    improvedScores: improvedProjected,
    currentOutcome: outcomeMap[horizon].current,
    improvedOutcome: outcomeMap[horizon].improved,
    delta: avgDelta,
  };
}

// ─── Smart Daily Mission ──────────────────────────────────────────────────────

export function getSmartMission(data: LifestyleData): DailyMission {
  const missions: (DailyMission & { score: number })[] = [];

  if (data.waterIntake < 2.5) {
    missions.push({
      score: 10 - data.waterIntake * 3,
      icon: "💧",
      title: "Drink 3L of Water Today",
      description: `You've averaged ${data.waterIntake}L. Reach 3L to boost energy and focus.`,
      category: "hydration",
      impactScore: 92,
      why: "Dehydration reduces cognitive performance by up to 20% and is a leading burnout accelerant.",
    });
  }

  if (data.sleepHours < 7) {
    missions.push({
      score: 8 - data.sleepHours,
      icon: "🌙",
      title: "Sleep Before 11 PM Tonight",
      description: `${data.sleepHours}h isn't enough. Target 7.5h for full recovery.`,
      category: "sleep",
      impactScore: 95,
      why: "Every hour below 7 increases cortisol by 15% — the primary burnout hormone.",
    });
  }

  if (data.exerciseTime < 30) {
    missions.push({
      score: (30 - data.exerciseTime) / 5,
      icon: "🏃",
      title: "20-Minute Walk Outside",
      description: "A short walk resets cortisol levels and increases BDNF for mental sharpness.",
      category: "exercise",
      impactScore: 88,
      why: "Just 20 minutes of movement increases productivity by 23% for the rest of the day.",
    });
  }

  if (data.screenTime > 7) {
    missions.push({
      score: data.screenTime - 5,
      icon: "📵",
      title: `No Screens After 9 PM`,
      description: `Cut ${data.screenTime - 5}h of screen exposure to protect melatonin production.`,
      category: "screen",
      impactScore: 85,
      why: "Blue light suppresses melatonin for 3+ hours, directly degrading sleep quality.",
    });
  }

  if (data.mealsType === "fastfood") {
    missions.push({
      score: 7,
      icon: "🥗",
      title: "Replace One Meal with Whole Foods",
      description: "Swap fast food for a home-cooked or fresh meal just once today.",
      category: "nutrition",
      impactScore: 80,
      why: "Ultra-processed food spikes and crashes blood sugar, draining afternoon energy.",
    });
  }

  if (data.steps < 6000) {
    missions.push({
      score: (10000 - data.steps) / 2000,
      icon: "👟",
      title: `Walk ${Math.max(2000, 8000 - data.steps).toLocaleString()} More Steps`,
      description: `You've logged ${data.steps.toLocaleString()} steps. Hit 8K for your health target.`,
      category: "exercise",
      impactScore: 78,
      why: "Sedentary days compound fatigue and double the risk of metabolic syndrome.",
    });
  }

  if (missions.length === 0) {
    return {
      icon: "🌟",
      title: "Maintain Your Excellent Habits",
      description: "You're performing at peak. Today's mission: consciously enjoy your well-being.",
      category: "exercise",
      impactScore: 100,
      why: "Consistency is the highest-impact habit. Keep reinforcing what's working.",
    };
  }

  missions.sort((a, b) => b.score - a.score);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { score: _score, ...mission } = missions[0];
  return mission;
}

// ─── Mood Weather ─────────────────────────────────────────────────────────────

export function getMoodWeather(data: LifestyleData): MoodWeather {
  const scores = calculateScores(data);
  const avg = (scores.health + scores.productivity + scores.sustainability) / 3;
  const burnout = calculateBurnout(data);

  const weatherMap: Record<WeatherType, MoodWeather> = {
    sunny: {
      weather: "sunny",
      label: "Sunny & Thriving",
      description: "Peak performance mode. Your habits are radiating positive energy.",
      emoji: "☀️",
      color: "text-yellow-400",
      glowColor: "hsl(45, 90%, 55%)",
    },
    "partly-cloudy": {
      weather: "partly-cloudy",
      label: "Partly Cloudy",
      description: "Good day overall, with a few lifestyle gaps worth addressing.",
      emoji: "⛅",
      color: "text-blue-300",
      glowColor: "hsl(200, 70%, 60%)",
    },
    cloudy: {
      weather: "cloudy",
      label: "Overcast & Sluggish",
      description: "Low energy signals detected. Focus on sleep and hydration.",
      emoji: "☁️",
      color: "text-slate-400",
      glowColor: "hsl(215, 25%, 55%)",
    },
    rainy: {
      weather: "rainy",
      label: "Rainy — Burnout Risk",
      description: "Multiple stress factors building up. Recovery habits needed today.",
      emoji: "🌧️",
      color: "text-indigo-400",
      glowColor: "hsl(240, 60%, 60%)",
    },
    stormy: {
      weather: "stormy",
      label: "Stormy — Critical Alert",
      description: "Unhealthy trend detected across all dimensions. Take action now.",
      emoji: "⛈️",
      color: "text-red-400",
      glowColor: "hsl(0, 72%, 55%)",
    },
  };

  let weather: WeatherType;
  if (burnout.level === "High" || avg < 30) weather = "stormy";
  else if (burnout.level === "Medium" && avg < 50) weather = "rainy";
  else if (avg < 55) weather = "cloudy";
  else if (avg < 72) weather = "partly-cloudy";
  else weather = "sunny";

  return weatherMap[weather];
}
