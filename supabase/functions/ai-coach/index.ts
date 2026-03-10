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
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are AI Life Copilot, a smart lifestyle and wellness coach.

Your goal is to give helpful advice that improves the user's health, productivity, and daily habits.

Adjust your response style based on the type of question:

CASE 1 — Lifestyle or habit improvement questions (e.g. "How can I improve my sleep?", "How do I reduce screen time?"):
• Keep answers short
• Use bullet points with emoji
• Focus on practical actions
• Limit to 3–5 suggestions

CASE 2 — Knowledge or explanation questions (e.g. "How can I make biriyani healthier?", "What foods improve energy?"):
• Provide a short explanation (1–2 sentences)
• Then list practical suggestions
• Keep under 120 words
• Avoid unnecessary long paragraphs

GENERAL RULES:
• Keep responses friendly and practical
• Avoid long essays
• Avoid repeating the user's question
• Focus on actionable guidance
• Prefer bullet points over paragraphs
• The response should feel like advice from a smart lifestyle coach, not a textbook

${lifestyleData ? `User lifestyle data: Sleep ${lifestyleData.sleepHours}h, Water ${lifestyleData.waterIntake}L, Steps ${lifestyleData.steps}, Meals ${lifestyleData.mealsType}, Screen ${lifestyleData.screenTime}h, Exercise ${lifestyleData.exerciseTime}min, Transport ${lifestyleData.transportType}. Use this to personalize tips.` : "No lifestyle data yet. Give general tips."}

${activeSuggestions?.length ? `ACTIVE SUGGESTIONS (previously given, not yet completed):\n${activeSuggestions.map((s: string) => `• ${s}`).join("\n")}\nWhen appropriate, follow up on these. Ask if they completed any. Don't repeat the same suggestions — build on them or suggest new ones.` : ""}

${completedSuggestions?.length ? `RECENTLY COMPLETED (user confirmed these):\n${completedSuggestions.map((s: string) => `✅ ${s}`).join("\n")}\nAcknowledge their progress positively and suggest next steps.` : ""}`;

    // Build Gemini-format contents from chat messages
    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    // Fetch with one retry on rate-limit or temporary errors
    const callGemini = async (): Promise<Response> => {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: geminiBody,
      });
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 2000));
        return fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: geminiBody,
        });
      }
      return res;
    };

    const response = await callGemini();

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "AI Coach is thinking... please try again." } }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI Coach is thinking... please try again.";

    return new Response(
      JSON.stringify({ choices: [{ message: { content } }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "AI Coach is thinking... please try again." } }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
