import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortalAuth } from "@/lib/auth/context";
import { scalePop } from "@/lib/motion";

import { Eye, EyeOff } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/portal/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Motiva Subscriber Portal" },
      {
        name: "description",
        content: "Sign in to view your Motiva subscriptions, documents and project updates.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Motiva Subscriber Portal" },
      { property: "og:description", content: "Private portal for Motiva Estate subscribers." },
    ],
  }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const navigate = useNavigate();
  const { user, ready, login } = usePortalAuth();
  const search = useSearch({ from: "/portal/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) {
      const home = user.role === "SUBSCRIBER" ? (search.redirect ?? "/portal") : "/admin";
      navigate({ to: home, replace: true });
    }
  }, [ready, user, navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success("Signed in");
      const home = u.role === "SUBSCRIBER" ? (search.redirect ?? "/portal") : "/admin";
      navigate({ to: home, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <motion.div
        className="w-full max-w-md"
        variants={scalePop}
        initial="initial"
        animate="animate"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground font-display text-xl">
            <img src="/apple-touch-icon.png" alt="Motiva Estate logo" className="rounded-md" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Subscriber Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view your subscription, documents and updates.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      toast.info("A reset link will be emailed once accounts are live.")
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
