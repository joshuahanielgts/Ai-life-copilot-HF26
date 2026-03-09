import { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, HelpCircle, LogOut, Cloud, Smartphone, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const profileItems = [
  { icon: Bell, label: "Notifications", desc: "Manage alert preferences" },
  { icon: Shield, label: "Privacy", desc: "Data and privacy settings" },
  { icon: Palette, label: "Appearance", desc: "Theme and display options" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQs and contact us" },
];

const Profile = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (error) toast.error("Google sign-in failed");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Authenticated UI ──
  if (session) {
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const avatarUrl = user.user_metadata?.avatar_url;
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
      <div className="min-h-screen pb-24 lg:pb-0 px-4 pt-8">
        <div className="max-w-lg mx-auto">
          {/* Avatar & Info */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-20 h-20 mb-3 border-2 border-primary/40">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-display font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-2 bg-accent/15 text-accent border-accent/30">
              <Cloud size={12} className="mr-1" /> Cloud Sync Enabled
            </Badge>
          </div>

          {/* Settings */}
          <div className="grid gap-3">
            {profileItems.map((item) => (
              <button key={item.label} className="glass-card p-4 flex items-center gap-4 w-full text-left hover:bg-primary/5 transition-colors">
                <div className="p-2 rounded-xl bg-muted">
                  <item.icon size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </button>
            ))}
            <button onClick={handleLogout} className="glass-card p-4 flex items-center gap-4 w-full text-left hover:bg-destructive/10 transition-colors">
              <div className="p-2 rounded-xl bg-destructive/10">
                <LogOut size={20} className="text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Guest UI ──
  return (
    <div className="min-h-screen pb-24 lg:pb-0 px-4 pt-8">
      <div className="max-w-lg mx-auto">
        {/* Guest Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center mb-3">
            <User size={36} className="text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold">Guest User</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Smartphone size={14} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Using local device storage</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="glass-card p-4 mb-6 border border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are currently using <span className="text-foreground font-medium">AI Life Copilot</span> as a guest. Your data is stored locally on this device. Sign in to sync your data to the cloud.
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="grid gap-3 mb-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Please wait…" : authMode === "login" ? "Login" : "Sign Up"}
          </Button>
        </form>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full mb-4" onClick={handleGoogleSignIn}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {authMode === "login" ? (
            <>Don't have an account?{" "}<button className="text-primary hover:underline" onClick={() => setAuthMode("signup")}>Sign Up</button></>
          ) : (
            <>Already have an account?{" "}<button className="text-primary hover:underline" onClick={() => setAuthMode("login")}>Login</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Profile;
