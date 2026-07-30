import { useState, useRef, useEffect } from "react";
import { Send, Bot, ArrowLeft, Menu, Eraser, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { LifestyleData } from "@/lib/store";
import { useChatThreads, type ChatMessage } from "@/hooks/useChatThreads";
import { useSuggestionTracker, extractSuggestions } from "@/hooks/useSuggestionTracker";
import ChatThreadSidebar from "@/components/ChatThreadSidebar";

const quickQuestions = [
  "How can I improve my sleep?",
  "How to reduce screen addiction?",
  "Tips for staying hydrated?",
  "Best exercise routine?",
];

const CHAT_RETRY_MESSAGE = "AI Coach is thinking... please try again.";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("sleep") || lower.includes("bed") || lower.includes("insomnia") || lower.includes("rest")) {
    return "Better sleep usually starts with consistency.\n\n• Keep the same sleep and wake time daily\n• Reduce screens 30-60 minutes before bed\n• Avoid caffeine late in the day\n• Keep your room cool, dark, and quiet";
  }

  if (lower.includes("water") || lower.includes("hydrat") || lower.includes("drink")) {
    return "Hydration improves energy and focus.\n\n• Keep a water bottle nearby\n• Drink a glass after waking up\n• Set reminders if you often forget\n• Increase fluids on hot or active days";
  }

  if (lower.includes("screen") || lower.includes("phone") || lower.includes("social media")) {
    return "Reducing screen overload works best with limits and replacement habits.\n\n• Set app time limits\n• Keep phones away during meals and bedtime\n• Turn off non-essential notifications\n• Replace scrolling with a short walk or reading";
  }

  if (lower.includes("exercise") || lower.includes("workout") || lower.includes("walk") || lower.includes("steps")) {
    return "A sustainable routine is better than an intense one you stop doing.\n\n• Aim for regular walking most days\n• Add 2-3 strength sessions weekly\n• Start with short sessions and build up\n• Track consistency more than perfection";
  }

  return "I can help with sleep, hydration, exercise, focus, and healthier routines. Ask me a specific lifestyle question and I’ll give practical next steps.";
}

function buildSystemPrompt(
  lifestyleData: LifestyleData | null,
  activeSuggestions: string[],
  completedSuggestions: string[],
): string {
  return `You are AI Life Copilot, a smart lifestyle and wellness coach.

Your goal is to give helpful advice that improves the user's health, productivity, and daily habits.

CASE 1 - Lifestyle or habit improvement questions:
- Keep answers short
- Use bullet points
- Focus on practical actions
- Limit to 3-5 suggestions

CASE 2 - Knowledge or explanation questions:
- Provide a short explanation (1-2 sentences)
- Then list practical suggestions
- Keep under 120 words

GENERAL RULES:
- Keep responses friendly and practical
- Avoid long essays or repeating the question
- Focus on actionable guidance
- Prefer bullet points over paragraphs

${lifestyleData ? `User lifestyle data: Sleep ${lifestyleData.sleepHours}h, Water ${lifestyleData.waterIntake}L, Steps ${lifestyleData.steps}, Meals ${lifestyleData.mealsType}, Screen ${lifestyleData.screenTime}h, Exercise ${lifestyleData.exerciseTime}min, Transport ${lifestyleData.transportType}. Personalize tips.` : "No lifestyle data yet. Give general tips."}

${activeSuggestions.length ? `ACTIVE SUGGESTIONS:\n${activeSuggestions.map((suggestion) => `- ${suggestion}`).join("\n")}\nFollow up on these. Don't repeat them directly - build on them.` : ""}

${completedSuggestions.length ? `RECENTLY COMPLETED:\n${completedSuggestions.map((suggestion) => `- ${suggestion}`).join("\n")}\nAcknowledge progress and suggest next steps.` : ""}`;
}

async function fetchFromGeminiDirect(
  chatHistory: Array<{ role: string; content: string }>,
  lifestyleData: LifestyleData | null,
  activeSuggestions: string[],
  completedSuggestions: string[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }

  const contents = chatHistory.slice(-10).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(lifestyleData, activeSuggestions, completedSuggestions) }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
    },
  });

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      },
    );

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      return content;
    }
  }

  throw new Error("Direct Gemini request failed");
}

const ThinkingDots = () => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span>AI analyzing your lifestyle{dots}</span>;
};

const ChatCoach = () => {
  const navigate = useNavigate();
  const {
    threads,
    activeThread,
    activeThreadId,
    createThread,
    switchThread,
    clearThread,
    deleteThread,
    setMessages,
    updateThreadTitle,
  } = useChatThreads();
  const { addSuggestions, completeSuggestion, getActiveSuggestions, getRecentCompleted } = useSuggestionTracker();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeThread.messages;



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getLifestyleData = (): LifestyleData | null => {
    try {
      const stored = localStorage.getItem("lifestyleData");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const handleCompleteSuggestion = (id: string, text: string) => {
    completeSuggestion(id);
    // Sync to insights: update lifestyle data based on completed suggestion category
    try {
      const stored = localStorage.getItem("lifestyleData");
      if (stored) {
        const data: LifestyleData = JSON.parse(stored);
        const lower = text.toLowerCase();
        if (lower.includes("step") || lower.includes("walk")) {
          data.steps = Math.min(data.steps + 2000, 15000);
        } else if (lower.includes("water") || lower.includes("hydrat")) {
          data.waterIntake = Math.min(data.waterIntake + 0.5, 4);
        } else if (lower.includes("sleep")) {
          data.sleepHours = Math.min(data.sleepHours + 0.5, 9);
        } else if (lower.includes("screen")) {
          data.screenTime = Math.max(data.screenTime - 1, 1);
        } else if (lower.includes("exercise") || lower.includes("workout")) {
          data.exerciseTime = Math.min(data.exerciseTime + 15, 90);
        }
        localStorage.setItem("lifestyleData", JSON.stringify(data));
      }
    } catch {
      // Ignore local sync errors and continue the chat flow.
    }
    // Send confirmation message to AI
    sendMessage(`Yes, I completed: "${text}"`);
  };

  const handleNotYet = (text: string) => {
    sendMessage(`Not yet — I haven't completed: "${text}"`);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Auto-title on first user message
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) {
      updateThreadTitle(activeThreadId, text);
    }

    // Add loading message
    setMessages((prev) => [...prev, { role: "assistant", content: "", isLoading: true }]);

    const lifestyleData = getLifestyleData();
    const activeSuggestions = getActiveSuggestions().map((s) => s.text);
    const completedSuggestions = getRecentCompleted().map((s) => s.text);
    const chatHistory = [...messages.filter((m) => !m.isLoading), userMsg].map(({ role, content }) => ({
      role,
      content,
    }));

    try {
      let assistantContent = "";

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
            },
            body: JSON.stringify({ messages: chatHistory, lifestyleData, activeSuggestions, completedSuggestions }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`AI coach request failed with ${response.status}`);
        }

        assistantContent = data.choices?.[0]?.message?.content || "";
      } catch (edgeFunctionError) {
        console.error("[AI Coach] Falling back to direct Gemini:", edgeFunctionError);
        assistantContent = await fetchFromGeminiDirect(chatHistory, lifestyleData, activeSuggestions, completedSuggestions);
      }

      if (!assistantContent) {
        assistantContent = getFallbackResponse(text);
      }

      // Extract and store suggestions from the AI response
      const extracted = extractSuggestions(assistantContent);
      if (extracted.length > 0) {
        addSuggestions(extracted);
      }

      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: assistantContent, isLoading: false }
            : m
        )
      );
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: getFallbackResponse(text) || CHAT_RETRY_MESSAGE, isLoading: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <ChatThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelect={switchThread}
        onCreate={createThread}
        onDelete={deleteThread}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 p-4 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Menu size={20} />
        </button>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="p-2 rounded-xl bg-primary/10">
          <Bot size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold truncate">{activeThread.title}</h2>
          <p className="text-xs text-muted-foreground">Always here to help</p>
        </div>
        <button
          onClick={clearThread}
          className="p-2 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground"
          title="Clear Thread"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${msg.role === "user" ? "flex justify-end" : "flex justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
              {msg.isLoading ? (
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  <ThinkingDots />
                </p>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <>
            {/* Active suggestions follow-up */}
            {getActiveSuggestions().length > 0 && (
              <div className="glass-card p-4 space-y-3 mt-2">
                <p className="text-sm font-medium text-foreground">📋 Follow up on your goals:</p>
                {getActiveSuggestions().slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 justify-between">
                    <p className="text-sm text-muted-foreground flex-1">{s.text}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCompleteSuggestion(s.id, s.text)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
                      >
                        <CheckCircle2 size={13} /> Yes
                      </button>
                      <button
                        onClick={() => handleNotYet(s.text)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                      >
                        <Clock size={13} /> Not yet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="glass-card p-3 text-sm text-left hover:bg-primary/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 p-4 backdrop-blur-xl border-t border-border/50" style={{ background: "hsl(var(--background) / 0.9)" }}>
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask your AI Coach..."
            disabled={isLoading}
            className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <Button variant="hero" size="icon" className="h-12 w-12 rounded-xl" onClick={() => sendMessage(input)} disabled={isLoading}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatCoach;
