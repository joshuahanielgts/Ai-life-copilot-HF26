import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import LifestyleInput from "./pages/LifestyleInput";
import Dashboard from "./pages/Dashboard";
import ChatCoach from "./pages/ChatCoach";
import Profile from "./pages/Profile";
import Forecast from "./pages/Forecast";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";
import VoiceAssistant from "./components/VoiceAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="dark">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/input" element={<LifestyleInput />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ChatCoach />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VoiceAssistant />
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
