import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetDb } from "@/lib/api/mock-db";
import { MOCK_BACKED_RESOURCES, SANITY_BACKED_RESOURCES } from "@/lib/sanity/resources";

export const Route = createFileRoute("/admin/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="System-level configuration." />
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Data sources</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Content resources have been migrated to Sanity. CRM resources and a few deferred
              content-config resources remain on the local mock database until they get their own backend.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Live on Sanity</p>
                <ul className="space-y-1">
                  {SANITY_BACKED_RESOURCES.map((name) => (
                    <li key={name} className="flex items-center justify-between rounded border border-border/60 px-3 py-1.5">
                      <span className="text-sm">{name}</span>
                      <Badge variant="secondary" className="text-[10px]">Sanity</Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Local mock DB</p>
                <ul className="space-y-1">
                  {MOCK_BACKED_RESOURCES.map((name) => (
                    <li key={name} className="flex items-center justify-between rounded border border-border/60 px-3 py-1.5">
                      <span className="text-sm">{name}</span>
                      <Badge variant="outline" className="text-[10px]">mock-db</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sanity project</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Project ID: <code className="rounded bg-muted px-1 py-0.5">znx01lol</code>
              &nbsp;·&nbsp; Dataset: <code className="rounded bg-muted px-1 py-0.5">production</code>
            </p>
            <p>
              Writes go through a server function that holds an Editor-scoped write token
              (<code className="rounded bg-muted px-1 py-0.5">SANITY_WRITE_TOKEN</code>) — the browser never sees it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Reset local demo data</p>
              <p className="text-xs text-muted-foreground">Clears the mock-db (CRM + deferred resources) and reseeds on next load.</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm("Reset all local admin data?")) return;
                resetDb();
                toast.success("Local data cleared — reloading");
                setTimeout(() => window.location.reload(), 500);
              }}
            >
              Reset
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
