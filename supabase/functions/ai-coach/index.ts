import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback knowledge base for when AI API is unavailable
const fallbackResponses: Record<string, string> = {
  sleep: "Improving sleep usually involves maintaining a consistent sleep schedule, reducing screen time before bed, and creating a relaxing night routine. 🌙\n\n• 😴 Go to bed and wake up at the same time daily\n• 📵 Avoid screens 30–60 min before bed\n• 🛁 Try a warm bath or light stretching to wind down\n• 🌑 Keep your room dark, cool, and quiet",
  hydration: "Staying hydrated is one of the simplest ways to boost your energy and focus. 💧\n\n• 🥤 Aim for 2–3 liters of water daily\n• ⏰ Drink a glass first thing in the morning\n• 🍉 Eat water-rich foods like fruits and vegetables\n• 📱 Set hourly reminders if you forget to drink",
  exercise: "Regular movement is key to physical and mental health. 🏃\n\n• 🚶 Aim for at least 7,000–10,000 steps daily\n• 💪 Mix cardio and strength training throughout the week\n• ⏱️ Even 15–20 minutes of activity makes a difference\n• 🧘 Include stretching or yoga for flexibility",
  screen: "Reducing screen time helps improve sleep, focus, and overall well-being. 📵\n\n• ⏰ Set daily screen time limits using your phone's built-in tools\n• 🚫 Designate screen-free zones (bedroom, dining table)\n• 📖 Replace scrolling with offline hobbies like reading\n• 🔕 Turn off non-essential notifications",
  productivity: "Better productivity starts with small, consistent habits. ⚡\n\n• 📝 Plan your top 3 priorities each morning\n• 🍅 Use the Pomodoro technique (25 min focus, 5 min break)\n• 📵 Minimize distractions during deep work blocks\n• ✅ Break large tasks into smaller, actionable steps",
  stress: "Managing stress is essential for long-term health and happiness. 🧘\n\n• 🫁 Practice deep breathing or meditation for 5–10 minutes daily\n• 🚶 Take regular walks in nature\n• 📓 Journal your thoughts to process emotions\n• 😴 Prioritize sleep — it's your body's best recovery tool",
};

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("sleep") || lower.includes("bed") || lower.includes("insomnia") || lower.includes("rest") || lower.includes("nap")) {
    return fallbackResponses.sleep;
  }
  if (lower.includes("water") || lower.includes("hydrat") || lower.includes("drink") || lower.includes("thirst")) {
    return fallbackResponses.hydration;
  }
  if (lower.includes("step") || lower.includes("walk") || lower.includes("exercise") || lower.includes("workout") || lower.includes("run") || lower.includes("gym") || lower.includes("cardio") || lower.includes("fitness")) {
    return fallbackResponses.exercise;
  }
  if (lower.includes("screen") || lower.includes("phone") || lower.includes("social media") || lower.includes("scroll") || lower.includes("device")) {
    return fallbackResponses.screen;
  }
  if (lower.includes("productiv") || lower.includes("focus") || lower.includes("procrastinat") || lower.includes("task") || lower.includes("work")) {
    return fallbackResponses.productivity;
  }
  if (lower.includes("stress") || lower.includes("anxi") || lower.includes("overwhelm") || lower.includes("relax") || lower.includes("calm") || lower.includes("mental health") || lower.includes("meditat")) {
    return fallbackResponses.stress;
  }
  return "I'm here to help with lifestyle improvements. Try asking about sleep, steps, hydration, or productivity. 😊";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let userMessage = "";

  try {
    const { messages, lifestyleData, activeSuggestions, completedSuggestions } = await req.json();

    // Extract last user message for fallback keyword matching
    userMessage = messages?.filter((m: { role: string }) => m.role === "user").pop()?.content || "";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      // No API key — use fallback
      return new Response(
        JSON.stringify({ choices: [{ message: { content: getFallbackResponse(userMessage) } }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are AI Life Copilot, a smart lifestyle and wellness coach.

Your goal is to give helpful advice that improves the user's health, productivity, and daily habits.

Adjust your response style based on the type of question:

CASE 1 — Lifestyle or habit improvement questions:
• Keep answers short
• Use bullet points with emoji
• Focus on practical actions
• Limit to 3–5 suggestions

CASE 2 — Knowledge or explanation questions:
• Provide a short explanation (1–2 sentences)
• Then list practical suggestions
• Keep under 120 words

GENERAL RULES:
• Keep responses friendly and practical
• Avoid long essays or repeating the question
• Focus on actionable guidance
• Prefer bullet points over paragraphs

${lifestyleData ? `User lifestyle data: Sleep ${lifestyleData.sleepHours}h, Water ${lifestyleData.waterIntake}L, Steps ${lifestyleData.steps}, Meals ${lifestyleData.mealsType}, Screen ${lifestyleData.screenTime}h, Exercise ${lifestyleData.exerciseTime}min, Transport ${lifestyleData.transportType}. Personalize tips.` : "No lifestyle data yet. Give general tips."}

${activeSuggestions?.length ? "ACTIVE SUGGESTIONS:\n" + activeSuggestions.map((s: string) => "• " + s).join("\n") + "\nFollow up on these. Don't repeat — build on them." : ""}

${completedSuggestions?.length ? "RECENTLY COMPLETED:\n" + completedSuggestions.map((s: string) => "✅ " + s).join("\n") + "\nAcknowledge progress and suggest next steps." : ""}`;

    // Only keep last 10 messages to avoid token limits
    const recentMessages = messages.slice(-10);
    const geminiContents = recentMessages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    let lastError = "";

    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const geminiBody = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: geminiBody,
        });

        if (res.status === 429 || res.status === 503) {
          lastError = `${model} returned ${res.status}`;
          console.log(`${model} rate limited (attempt ${attempt + 1})`);
          continue;
        }

        if (!res.ok) {
          const t = await res.text();
          console.error(`${model} error:`, res.status, t);
          lastError = `${model} error ${res.status}`;
          break;
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          lastError = `${model} returned empty response`;
          break;
        }

        return new Response(
          JSON.stringify({ choices: [{ message: { content } }] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // All models failed — return fallback response
    console.log("All models failed, using fallback. Last error:", lastError);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: getFallbackResponse(userMessage) } }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: getFallbackResponse(userMessage) } }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});