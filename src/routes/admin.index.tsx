import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users2, CreditCard, Clock, Mail, FileText, Building2, Home } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { KpiGridSkeleton } from "@/components/admin/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboardStats(),
  });

  const stats = data;

  const kpis = [
    {
      label: "Active clients",
      value: stats?.clientsActive ?? "—",
      sub: `${stats?.clientsTotal ?? 0} total`,
      icon: Users2,
    },
    {
      label: "Active subscriptions",
      value: stats?.subscriptionsActive ?? "—",
      sub: `${stats?.expiringSoon ?? 0} expiring in 30d`,
      icon: CreditCard,
    },
    { label: "Expiring soon", value: stats?.expiringSoon ?? "—", sub: "Next 30 days", icon: Clock },
    {
      label: "New enquiries",
      value: stats?.enquiriesNew ?? "—",
      sub: `${stats?.enquiriesUnassigned ?? 0} unassigned`,
      icon: Mail,
    },
    {
      label: "Awaiting review",
      value: stats?.contentInReview ?? "—",
      sub: "Projects + properties",
      icon: FileText,
    },
    {
      label: "Published projects",
      value: stats?.publishedProjects ?? "—",
      sub: `${stats?.draftProjects ?? 0} drafts`,
      icon: Building2,
    },
    {
      label: "Published properties",
      value: stats?.publishedProperties ?? "—",
      sub: `${stats?.draftProperties ?? 0} drafts`,
      icon: Home,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of clients, content, and enquiries across Motiva."
      />
      {!stats ? (
        <KpiGridSkeleton count={7} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </div>
                  <div className="mt-2 font-display text-3xl text-foreground">{k.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <ul className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="py-3 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </li>
                ))}
              </ul>
            ) : stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent actions yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentActivity.slice(0, 5).map((a: any) => (
                  <li key={a.id} className="flex items-start justify-between py-3">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">{a.actorName}</span>{" "}
                        <span className="text-muted-foreground">{a.action.toLowerCase()}</span>{" "}
                        <span className="font-medium">{a.entityType}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(a.createdAt), "MMM d, p")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          {stats && stats.recentActivity.length > 0 && (
            <CardFooter className="pt-0">
              <Button asChild variant="ghost" size="sm" className="ml-auto text-xs">
                <Link to="/admin/audit">See all →</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The admin is connected to the NestJS API at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_API_BASE_URL</code>. CRM
              data (clients, subscriptions, payments, enquiries) is stored in MongoDB. Content
              (projects, gallery, team) is stored in Sanity.
            </p>
            <p>
              Subscriber portal users can log in at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/portal/login</code> after an
              admin creates their account with role{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">SUBSCRIBER</code> and links it
              to a client record.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
