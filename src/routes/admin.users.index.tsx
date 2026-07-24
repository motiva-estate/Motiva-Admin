import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { Role, User } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/api/types";
import { RoleBadge } from "@/components/admin/StatusBadges";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
});

function UsersPage() {
  return (
    <CollectionAdmin<User>
      title="Users & Roles"
      description="Manage team accounts and role assignments."
      queryKey="users"
      fetcher={() => api.users.list()}
      creator={(i) => api.users.create(i)}
      updater={(id, p) => api.users.update(id, p)}
      remover={(id) => api.users.remove(id)}
      emptyPrompt="Invite the first admin user."
      defaults={{ fullName: "", email: "", role: "VIEWER", isActive: true, twoFAEnabled: false }}
      columns={[
        { header: "Name", render: (r) => (
          <div>
            <div className="font-medium">{r.fullName}</div>
            <div className="text-xs text-muted-foreground">{r.email}</div>
          </div>
        ) },
        { header: "Role", render: (r) => <RoleBadge role={r.role} /> },
        { header: "2FA", render: (r) => r.twoFAEnabled ? <Badge>Enabled</Badge> : <Badge variant="outline">Off</Badge> },
        { header: "Status", render: (r) => r.isActive ? <Badge>Active</Badge> : <Badge variant="destructive">Disabled</Badge> },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2"><Label>Full name</Label><Input value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Switch checked={!!form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={!!form.twoFAEnabled} onCheckedChange={(v) => setForm({ ...form, twoFAEnabled: v })} /><Label>2FA enabled</Label></div>
          </div>
        </>
      )}
    />
  );
}
