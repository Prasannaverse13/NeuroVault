import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Github, Mail } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0b0f1a] px-4 py-12 text-white [font-family:'Inter',Helvetica]">
      <div className="absolute left-1/2 top-1/2 -z-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed1a] blur-[80px]" />

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#ffffff14] bg-[#ffffff08] shadow-[0px_25px_50px_-12px_#00000040] backdrop-blur-xl">
        <CardContent className="p-8">
          <Link
            href="/"
            data-testid="link-auth-logo"
            className="mb-6 flex items-center gap-2 text-lg tracking-[-0.5px] text-white"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]" />
            NeuroVault
          </Link>

          <Badge className="mb-4 border border-[#ffffff1a] bg-[#ffffff0d] px-3 py-1 text-[10px] tracking-[1px] text-violet-400 hover:bg-[#ffffff0d]">
            {mode === "login" ? "WELCOME BACK" : "CREATE WORKSPACE"}
          </Badge>

          <h1 className="text-2xl text-white">
            {mode === "login" ? "Sign in to your vault" : "Start building memory"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "login"
              ? "Access your agents, memories, and integrations."
              : "Spin up a workspace in under a minute."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="ghost"
              data-testid="button-oauth-github"
              className="rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-sm text-white hover:bg-[#ffffff14]"
            >
              <Github className="mr-2 h-4 w-4" /> GitHub
            </Button>
            <Button
              type="button"
              variant="ghost"
              data-testid="button-oauth-google"
              className="rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-sm text-white hover:bg-[#ffffff14]"
            >
              <Mail className="mr-2 h-4 w-4" /> Google
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[10px] tracking-[1px] text-slate-500">
            <span className="h-px flex-1 bg-[#ffffff14]" />
            OR
            <span className="h-px flex-1 bg-[#ffffff14]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Full name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Aria Kepler"
                  data-testid="input-name"
                  className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                data-testid="input-email"
                required
                className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                  className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  data-testid="button-toggle-password"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-submit-auth"
              className="h-auto w-full rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] py-3 text-sm text-white hover:opacity-95"
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === "login" ? "Don't have an account?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              data-testid="button-switch-mode"
              className="text-violet-400 hover:text-violet-300"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
