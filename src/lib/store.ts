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

export const SCORE_BREAKDOWNS = {
  health: [
    { factor: "Sleep Duration", weight: "25%" },
    { factor: "Water Intake", weight: "25%" },
    { factor: "Daily Steps", weight: "25%" },
    { factor: "Diet Quality", weight: "25%" },
    { factor: "Exercise", weight: "10%" }
  ],
  productivity: [
    { factor: "Screen Time", weight: "35%" },
    { factor: "Sleep Quality", weight: "35%" },
    { factor: "Exercise", weight: "15%" },
    { factor: "Diet Quality", weight: "15%" }
  ],
  sustainability: [
    { factor: "Transport Mode", weight: "40%" },
    { factor: "Diet Quality", weight: "30%" },
    { factor: "Water Conservation", weight: "15%" },
    { factor: "Screen Time (Energy)", weight: "15%" }
  ]
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
