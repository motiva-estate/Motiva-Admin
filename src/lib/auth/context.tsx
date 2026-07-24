// Mock auth context. Login checks against the seeded users list; any
// password is accepted (this is a demo shell). Swap `login` to POST to
// /auth/login on the NestJS API when it's ready.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "../api/types";
import { api } from "../api/client";

const SESSION_KEY = "motiva.admin.session.v1";

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  can: (action: Action) => boolean;
}

// Fine-grained action gates used across the admin.
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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const login: AuthState["login"] = async (email) => {
    const users = await api.users.list();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error("No account with that email.");
    if (!found.isActive) throw new Error("This account has been deactivated.");
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    setUser(found);
    return found;
  };

  const logout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const hasRole = (role: Role) => user?.role === role;
  const hasAnyRole = (roles: Role[]) => (user ? roles.includes(user.role) : false);
  const can = (action: Action) =>
    user ? CAPABILITIES[user.role].includes(action) : false;

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
