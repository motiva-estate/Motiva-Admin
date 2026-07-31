// Auth context — backed by the NestJS /api/auth/* endpoints.
//
// Access token lives in memory only (never localStorage) to guard against XSS.
// Refresh token is an HttpOnly cookie set by the server.
// On page refresh, /api/auth/refresh is called immediately to restore the session.
//
// Swap VITE_API_BASE_URL in .env to point at the deployed API.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "../api/types";
import { setAccessToken } from "../api/client";

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:4000/api";

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  can: (action: Action) => boolean;
}

export type Action =
  | "content.create"
  | "content.edit"
  | "content.publish"
  | "content.archive"
  | "seo.manage"
  | "contact.manage"
  | "homepage.manage"
  | "clients.manage"
  | "subscriptions.manage"
  | "enquiries.assign"
  | "users.manage"
  | "audit.view"
  | "settings.manage";

const CAPABILITIES: Record<Role, Action[]> = {
  SUPER_ADMIN: [
    "content.create",
    "content.edit",
    "content.publish",
    "content.archive",
    "seo.manage",
    "contact.manage",
    "homepage.manage",
    "clients.manage",
    "subscriptions.manage",
    "enquiries.assign",
    "users.manage",
    "audit.view",
    "settings.manage",
  ],
  ADMINISTRATOR: [
    "content.create",
    "content.edit",
    "content.publish",
    "content.archive",
    "seo.manage",
    "contact.manage",
    "homepage.manage",
    "clients.manage",
    "subscriptions.manage",
    "enquiries.assign",
    "audit.view",
  ],
  CONTENT_EDITOR: ["content.create", "content.edit", "clients.manage", "enquiries.assign"],
  VIEWER: [],
  SUBSCRIBER: [],
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // On mount — attempt to restore session via refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          // Fetch current user profile
          const me = await fetch(`${BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
            credentials: "include",
          });
          if (me.ok) {
            const userData = await me.json();
            setUser(normalise(userData));
          }
        }
      } catch {
        // No valid session — just mark as ready
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login: AuthState["login"] = async (email, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Sign in failed" }));
      throw new Error(err.message ?? "Sign in failed");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    const u = normalise(data.user);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await fetch(`${BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  };

  const hasRole = (role: Role) => user?.role === role;
  const hasAnyRole = (roles: Role[]) => (user ? roles.includes(user.role) : false);
  const can = (action: Action) => (user ? (CAPABILITIES[user.role] ?? []).includes(action) : false);

  return (
    <AuthCtx.Provider value={{ user, ready, login, logout, hasRole, hasAnyRole, can }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// The NestJS response uses _id (Mongoose). Normalise to id.
function normalise(u: any): User {
  return { ...u, id: u.id ?? u._id };
}

// Lazily import getAccessToken to avoid circular dep
async function getToken(): Promise<string | null> {
  const { getAccessToken } = await import("../api/client");
  return getAccessToken();
}
