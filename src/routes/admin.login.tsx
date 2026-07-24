import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/admin/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready, login } = useAuth();
  const search = useSearch({ from: "/admin/login" });
  const [email, setEmail] = useState("admin@motivaestate.com");
  const [password, setPassword] = useState("demo");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) {
      const home = user.role === "SUBSCRIBER" ? "/portal" : "/admin";
      navigate({ to: search.redirect ?? home, replace: true });
    }
  }, [ready, user, navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success("Signed in");
      const home = u.role === "SUBSCRIBER" ? "/portal" : "/admin";
      navigate({ to: search.redirect ?? home, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground font-display text-xl">
            M
          </div>
          <h1 className="font-display text-3xl text-foreground">Motiva Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your team credentials.
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Demo accounts</p>
                <ul className="mt-1 space-y-0.5">
                  <li>admin@motivaestate.com — Super Admin</li>
                  <li>manager@motivaestate.com — Administrator</li>
                  <li>editor@motivaestate.com — Content Editor</li>
                  <li>subscriber@motivaestate.com — Subscriber (portal)</li>
                </ul>
                <p className="mt-2">Any password works in this demo build.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
