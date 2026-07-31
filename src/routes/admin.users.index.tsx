import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { Role, User } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/api/types";
import { RoleBadge } from "@/components/admin/StatusBadges";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
});

// Extend the User type locally to include the password field used only at
// create-time (the API accepts it but never returns it).
type UserFormData = Partial<User> & { password?: string };

function UsersPage() {
  // We need the client list to populate the clientId picker for SUBSCRIBER role.
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
  });
  const clientList = clients?.data ?? [];

  return (
    <CollectionAdmin<User>
      title="Users & Roles"
      description="Manage team accounts and portal subscriber accounts. Set role to Subscriber and pick the linked client to grant portal access."
      queryKey="users"
      fetcher={() => api.users.list()}
      creator={(i) => api.users.create(i)}
      updater={(id, p) => api.users.update(id, p)}
      remover={(id) => api.users.remove(id)}
      emptyPrompt="Invite the first admin user."
      defaults={
        {
          fullName: "",
          email: "",
          password: "",
          role: "VIEWER",
          isActive: true,
          twoFAEnabled: false,
          clientId: "",
        } as UserFormData
      }
      columns={[
        {
          header: "Name",
          render: (r) => (
            <div>
              <div className="font-medium">{r.fullName}</div>
              <div className="text-xs text-muted-foreground">{r.email}</div>
            </div>
          ),
        },
        { header: "Role", render: (r) => <RoleBadge role={r.role} /> },
        {
          header: "Client link",
          render: (r) =>
            r.clientId ? (
              <span className="font-mono text-xs text-muted-foreground">
                {r.clientId.slice(-8)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
        {
          header: "2FA",
          render: (r) =>
            r.twoFAEnabled ? <Badge>Enabled</Badge> : <Badge variant="outline">Off</Badge>,
        },
        {
          header: "Status",
          render: (r) =>
            r.isActive ? <Badge>Active</Badge> : <Badge variant="destructive">Disabled</Badge>,
        },
      ]}
      renderForm={(form: UserFormData, setForm) => (
        <>
          {/* Name */}
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={form.fullName ?? ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Password — only required on create; leave blank when editing to keep existing */}
          <div className="space-y-2">
            <Label>
              Password
              {form.id && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={(form as any).password ?? ""}
              placeholder={form.id ? "••••••••" : "Set initial password"}
              onChange={(e) => setForm({ ...form, password: e.target.value } as UserFormData)}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role ?? "VIEWER"}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  role: v as Role,
                  clientId: v !== "SUBSCRIBER" ? "" : form.clientId,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* clientId — shown only when role is SUBSCRIBER */}
          {form.role === "SUBSCRIBER" && (
            <div className="space-y-2">
              <Label>
                Linked client{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (required for portal access)
                </span>
              </Label>
              {clientList.length > 0 ? (
                <Select
                  value={form.clientId ?? ""}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientList.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.fullName} <span className="text-muted-foreground">— {c.email}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // Fallback: manual entry if client list hasn't loaded
                <Input
                  value={form.clientId ?? ""}
                  placeholder="Client MongoDB _id"
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                />
              )}
              <p className="text-xs text-muted-foreground">
                This links the portal login to the client's subscriptions, documents, and payments.
              </p>
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={!!form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="twoFA"
                checked={!!form.twoFAEnabled}
                onCheckedChange={(v) => setForm({ ...form, twoFAEnabled: v })}
              />
              <Label htmlFor="twoFA">2FA enabled</Label>
            </div>
          </div>
        </>
      )}
    />
  );
}
