import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/admin/StatusBadges";
import { pageProps } from "@/lib/motion";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const matches = useRouterState({ select: (s) => s.matches });
  const routeId = matches[matches.length - 1]?.id;

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!isLogin && ready && !user) {
      navigate({
        to: "/admin/login",
        search: { redirect: window.location.pathname },
        replace: true,
      });
    }
  }, [ready, user, navigate, isLogin]);

  if (isLogin) return <Outlet />;

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Loading admin…
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">Motiva Admin</div>
            </div>
            <div className="flex items-center gap-3">
              <RoleBadge role={user.role} />
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium leading-none">{user.fullName}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* <AnimatePresence mode="wait"> */}
            <motion.div key={pathname} {...pageProps}>
              <Outlet />
            </motion.div>
            {/* </AnimatePresence> */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
