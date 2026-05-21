// Simple state store for lifestyle data
export interface LifestyleData {
  sleepHours: number;
  waterIntake: number;
  steps: number;
  mealsType: "healthy" | "fastfood" | "mixed";
  screenTime: number;
  exerciseTime: number;
  transportType: "car" | "bike" | "public" | "walk";
}

export const defaultData: LifestyleData = {
  sleepHours: 7,
  waterIntake: 2,
  steps: 5000,
  mealsType: "mixed",
  screenTime: 6,
  exerciseTime: 30,
  transportType: "public",
};

export function calculateScores(data: LifestyleData) {
  // Health Score
  let health = 0;
  health += Math.min(data.sleepHours / 8, 1) * 25;
  health += Math.min(data.waterIntake / 3, 1) * 25;
  health += Math.min(data.steps / 10000, 1) * 25;
  health += (data.mealsType === "healthy" ? 25 : data.mealsType === "mixed" ? 15 : 5);
  health += Math.min(data.exerciseTime / 60, 1) * 10;
  health = Math.min(Math.round(health), 100);

  // Productivity Score
  let productivity = 0;
  productivity += Math.max(0, (1 - data.screenTime / 12)) * 35;
  productivity += Math.min(data.sleepHours / 8, 1) * 35;
  productivity += Math.min(data.exerciseTime / 60, 1) * 15;
  productivity += (data.mealsType === "healthy" ? 15 : data.mealsType === "mixed" ? 8 : 3);
  productivity = Math.min(Math.round(productivity), 100);

  // Sustainability Score
  let sustainability = 0;
  const transportScores = { walk: 40, bike: 35, public: 25, car: 5 };
  sustainability += transportScores[data.transportType];
  sustainability += (data.mealsType === "healthy" ? 30 : data.mealsType === "mixed" ? 15 : 5);
  sustainability += Math.min(data.waterIntake / 3, 1) * 15;
  sustainability += Math.max(0, (1 - data.screenTime / 12)) * 15;
  sustainability = Math.min(Math.round(sustainability), 100);

  return { health, productivity, sustainability };
}

export function getImprovements(data: LifestyleData) {
  const suggestions: { text: string; icon: string; impact: "High" | "Medium" | "Low" }[] = [];

  if (data.steps < 10000) suggestions.push({ text: `Walk ${10000 - data.steps} more steps`, icon: "👟", impact: "High" });
  if (data.waterIntake < 3) suggestions.push({ text: `Increase water intake by ${(3 - data.waterIntake).toFixed(1)}L`, icon: "💧", impact: "High" });
  if (data.mealsType === "fastfood") suggestions.push({ text: "Replace fast food with vegetables once today", icon: "🥗", impact: "High" });
  if (data.sleepHours < 7) suggestions.push({ text: "Sleep before 11 PM tonight", icon: "🌙", impact: "High" });
  if (data.screenTime > 6) suggestions.push({ text: `Reduce screen time by ${data.screenTime - 6} hours`, icon: "📱", impact: "Medium" });
  if (data.exerciseTime < 30) suggestions.push({ text: "Add 30 minutes of exercise", icon: "💪", impact: "Medium" });
  if (data.transportType === "car") suggestions.push({ text: "Try public transport or cycling today", icon: "🚲", impact: "Low" });

  return suggestions.length > 0 ? suggestions : [{ text: "You're doing great! Keep it up!", icon: "🎉", impact: "Low" as const }];
}

export function calculateStreaks(history: { day: string; data: LifestyleData }[]) {
  let sleep = 0;
  let water = 0;
  let steps = 0;
  let exercise = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].data.sleepHours >= 7) sleep++; else break;
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].data.waterIntake >= 2) water++; else break;
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].data.steps >= 8000) steps++; else break;
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].data.exerciseTime >= 30) exercise++; else break;
  }

  return { sleep, water, steps, exercise };
}

export function calculateWeeklyAverages(history: { day: string; data: LifestyleData }[]) {
  if (history.length === 0) {
    return { sleepHours: 0, waterIntake: 0, steps: 0, screenTime: 0, exerciseTime: 0 };
  }
  const totals = history.reduce(
    (acc, cur) => {
      acc.sleepHours += cur.data.sleepHours;
      acc.waterIntake += cur.data.waterIntake;
      acc.steps += cur.data.steps;
      acc.screenTime += cur.data.screenTime;
      acc.exerciseTime += cur.data.exerciseTime;
      return acc;
    },
    { sleepHours: 0, waterIntake: 0, steps: 0, screenTime: 0, exerciseTime: 0 }
  );

  const len = history.length;
  return {
    sleepHours: Math.round((totals.sleepHours / len) * 10) / 10,
    waterIntake: Math.round((totals.waterIntake / len) * 10) / 10,
    steps: Math.round(totals.steps / len),
    screenTime: Math.round((totals.screenTime / len) * 10) / 10,
    exerciseTime: Math.round(totals.exerciseTime / len),
  };
}

export function calculateConsistencyScore(history: { day: string; data: LifestyleData }[]) {
  if (history.length === 0) return 0;
  let successfulHabits = 0;
  history.forEach((h) => {
    const d = h.data;
    if (d.sleepHours >= 7) successfulHabits++;
    if (d.waterIntake >= 2) successfulHabits++;
    if (d.steps >= 8000) successfulHabits++;
    if (d.exerciseTime >= 30) successfulHabits++;
    if (d.screenTime <= 6) successfulHabits++;
  });
  return Math.round((successfulHabits / (history.length * 5)) * 100);
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function getAchievementBadges(history: { day: string; data: LifestyleData }[]): BadgeItem[] {
  const averages = calculateWeeklyAverages(history);
  const consistency = calculateConsistencyScore(history);

  let waterDays = 0;
  let sleepDays = 0;
  let screenDays = 0;

  history.forEach((h) => {
    if (h.data.waterIntake >= 2) waterDays++;
    if (h.data.sleepHours >= 7.5) sleepDays++;
    if (h.data.screenTime < 5) screenDays++;
  });

  return [
    {
      id: "hydration_hero",
      name: "Hydration Hero",
      description: "Hit water intake target (>= 2L) for at least 3 days this week.",
      icon: "💧",
      unlocked: waterDays >= 3,
    },
    {
      id: "sleep_champion",
      name: "Sleep Champion",
      description: "Slept 7.5+ hours on at least 3 days.",
      icon: "🌙",
      unlocked: sleepDays >= 3,
    },
    {
      id: "active_warrior",
      name: "Active Warrior",
      description: "Averaged 9,000+ steps or 40+ minutes of daily exercise.",
      icon: "⚡",
      unlocked: averages.steps >= 9000 || averages.exerciseTime >= 40,
    },
    {
      id: "screen_slasher",
      name: "Screen Slasher",
      description: "Kept screen time under 5 hours on at least 3 days.",
      icon: "📱",
      unlocked: screenDays >= 3,
    },
    {
      id: "consistency_king",
      name: "Consistency King",
      description: "Maintained a weekly habit consistency score of 80% or more.",
      icon: "🏆",
      unlocked: consistency >= 80,
    },
  ];
}

export function getOrInitializeHistory(currentData: LifestyleData) {
  const historyStr = localStorage.getItem("lifestyleHistory");
  let history: { day: string; data: LifestyleData }[] = [];
  try {
    if (historyStr) {
      history = JSON.parse(historyStr);
    }
  } catch {}

  if (history.length >= 4) {
    return history;
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay();
  const mockHistory: { day: string; data: LifestyleData }[] = [];

  for (let i = 6; i >= 1; i--) {
    const targetIndex = (todayIndex - i + 7) % 7;
    const dayName = weekdays[targetIndex];
    const mockData: LifestyleData = {
      sleepHours: 6.5 + Math.random() * 2,
      waterIntake: 1.8 + Math.random() * 1.5,
      steps: Math.floor(6000 + Math.random() * 7000),
      mealsType: Math.random() > 0.4 ? "healthy" : "mixed",
      screenTime: 3.5 + Math.random() * 4,
      exerciseTime: Math.random() > 0.3 ? 20 + Math.floor(Math.random() * 45) : 0,
      transportType: Math.random() > 0.5 ? "walk" : "public",
    };
    mockHistory.push({ day: dayName, data: mockData });
  }

  const todayName = weekdays[todayIndex];
  mockHistory.push({ day: todayName, data: currentData });

  localStorage.setItem("lifestyleHistory", JSON.stringify(mockHistory));
  return mockHistory;
}

