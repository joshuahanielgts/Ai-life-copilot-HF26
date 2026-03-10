import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lifestyleData, activeSuggestions, completedSuggestions } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    return new Response(
      JSON.stringify({ error: `AI models temporarily busy. ${lastError}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(
      JSON.stringify({ error: `Edge function error: ${e.message || String(e)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});