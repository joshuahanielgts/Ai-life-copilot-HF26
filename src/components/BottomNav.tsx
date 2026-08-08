import { Home, Lightbulb, PlusCircle, Bot, User, Plus, Telescope, Flame } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Lightbulb, label: "Dashboard", path: "/dashboard" },
  { icon: Flame, label: "Weekly", path: "/insights" },
  { icon: PlusCircle, label: "Add Log", path: "/input" },
  { icon: Telescope, label: "Forecast", path: "/forecast" },
  { icon: Bot, label: "AI Coach", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setExpanded(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [expanded]);

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile bottom nav (<1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 backdrop-blur-xl px-2 py-2"
        style={{ background: "hsl(230 25% 10% / 0.92)" }}
      >
        <div className="flex items-center justify-around">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon
                  size={22}
                  className={`transition-all duration-200 ${active ? "drop-shadow-[0_0_8px_hsl(265,80%,60%)]" : ""}`}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop floating dock (>=1024px) */}
      <div ref={navRef} className="hidden lg:block fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!expanded && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setExpanded(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center border border-primary/30 backdrop-blur-xl shadow-[0_4px_24px_hsl(265,80%,60%,0.3)] transition-transform hover:scale-110"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus size={28} className="text-primary-foreground" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expanded && (
            <motion.nav
              key="dock"
              initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: "calc(-50vw + 50% + 24px)",
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="rounded-2xl border border-primary/20 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_32px_hsl(265,80%,60%,0.18)]"
              style={{ background: "hsl(230 25% 10% / 0.88)" }}
            >
              <div className="flex items-center gap-2">
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`group relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 hover:scale-110 hover:text-primary ${active ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <item.icon
                        size={22}
                        className={`transition-all duration-200 ${active ? "drop-shadow-[0_0_8px_hsl(265,80%,60%)]" : "group-hover:drop-shadow-[0_0_6px_hsl(265,80%,60%,0.5)]"}`}
                      />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setExpanded(false)}
                  className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default BottomNav;
