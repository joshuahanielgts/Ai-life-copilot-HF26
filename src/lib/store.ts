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
  const suggestions: { text: string; icon: string; impact: "High" | "Medium" | "Low"; reason?: string; benefit?: string }[] = [];

  if (data.steps < 10000) suggestions.push({ text: `Walk ${10000 - data.steps} more steps`, icon: "👟", impact: "High", reason: "Walking 10,000 steps daily improves cardiovascular health and boosts metabolism.", benefit: "Boosts Health Score by up to 25 points." });
  if (data.waterIntake < 3) suggestions.push({ text: `Increase water intake by ${(3 - data.waterIntake).toFixed(1)}L`, icon: "💧", impact: "High", reason: "Adequate hydration is crucial for cognitive function, energy levels, and physical performance.", benefit: "Improves Health and Sustainability Scores." });
  if (data.mealsType === "fastfood") suggestions.push({ text: "Replace fast food with vegetables once today", icon: "🥗", impact: "High", reason: "Vegetables provide essential vitamins and fiber, while reducing saturated fats and sodium.", benefit: "Significantly boosts Health and Sustainability Scores." });
  if (data.sleepHours < 7) suggestions.push({ text: "Sleep before 11 PM tonight", icon: "🌙", impact: "High", reason: "Getting 7-8 hours of sleep helps muscle recovery, memory consolidation, and reduces stress.", benefit: "Boosts Health and Productivity Scores." });
  if (data.screenTime > 6) suggestions.push({ text: `Reduce screen time by ${data.screenTime - 6} hours`, icon: "📱", impact: "Medium", reason: "Excessive screen time can lead to eye strain, poor posture, and disrupted sleep patterns.", benefit: "Improves Productivity and Sustainability Scores." });
  if (data.exerciseTime < 30) suggestions.push({ text: "Add 30 minutes of exercise", icon: "💪", impact: "Medium", reason: "Regular exercise reduces the risk of chronic diseases and improves mental health.", benefit: "Boosts Health and Productivity Scores." });
  if (data.transportType === "car") suggestions.push({ text: "Try public transport or cycling today", icon: "🚲", impact: "Low", reason: "Using alternatives to cars reduces carbon footprint and adds light physical activity.", benefit: "Boosts Sustainability Score by up to 35 points." });

  return suggestions.length > 0 ? suggestions : [{ text: "You're doing great! Keep it up!", icon: "🎉", impact: "Low" as const, reason: "Your current lifestyle metrics are excellent.", benefit: "Maintains optimal scores across all categories." }];
}
