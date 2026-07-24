## Goal
Give admin full control over every subscriber-portal feature. Today the portal reads fields (project ref, payment plan, installments, notification prefs) that admin has no UI to edit — I'll close those gaps, and pull subscription management inline into the client editor as requested.

## 1. Subscription form — enrich fields (`/admin/subscriptions` + client editor)
Add to the "New / edit subscription" dialog:
- **Project link**: `projectRefType` (Project / Land parcel) + `projectRef` selector populated from `api.projects.list()` and `api.land.list()`.
- **Agreed dates**: keep `startDate` / `endDate`, relabel as "Agreement start / end".
- **Payment plan**: `totalPrice`, `amountPaid` (read-only, derived from payments), `nextDueDate`, plus an inline **installment schedule editor** — table with rows `{ dueDate, amount, label }`, add/remove/reorder. Persisted on the subscription record.
- **Status / auto-renew**: unchanged.

Make the same dialog reusable so it can be opened from both `/admin/subscriptions` and the client editor.

## 2. Client editor — inline subscription management
On `/admin/clients/$id`, add a "Subscriptions" section (currently missing) that:
- Lists this client's subscriptions with plan, project link, agreed period, total, paid, next due, status.
- **Add subscription** button opens the enriched dialog pre-filled with `clientId`.
- **Edit** on each row reopens the dialog for that subscription.
- **View schedule** expander shows the installment breakdown inline.
- Adds a "Notification preferences" panel (email / WhatsApp toggles) and a "Reset contact confirmation" button that clears `contactConfirmedAt` so the subscriber sees the first-login prompt again.

## 3. Payments — new admin surface
New page `src/routes/admin.payments.index.tsx` + sidebar entry:
- Table of all recorded payments (client, subscription, date, amount, method, reference, status).
- "Record payment" dialog: pick client → subscription → enter amount, date, method, reference, notes. On save, updates `subscription.amountPaid` and recomputes `nextDueDate` from the schedule.
- Per-payment delete (with confirm) that reverses the totals.

Also expose "Record payment" as a shortcut inside each subscription row in the client editor.

## 4. Data-layer updates (mock DB + API client)
- `api.subscriptions.update` already exists; extend the `Subscription` writer to accept `installments`, `projectRef`, `projectRefType`, `totalPrice`, `nextDueDate` (types are already declared).
- Add `api.payments.create` / `remove` that also patch the parent subscription's `amountPaid` and `nextDueDate` atomically.
- Add `api.clients.update` support for `notificationPrefs` and `contactConfirmedAt` (fields already on the type).
- Bump `mockDb` storage version to `v10` and reseed demo data so Elena's two subs have real installment rows and a couple of recorded payments to demonstrate the flow.

## 5. Sidebar + audit
- Add "Payments" to `AdminSidebar` between Subscriptions and Documents.
- Record audit-log entries for: subscription create/update, payment record/delete, contact-confirmation reset.

## Out of scope (call out, don't build)
- Real file uploads for documents (still URL-based).
- Real payment gateway — the "Generate payment reference" button in the portal remains a placeholder.
- Notification delivery (WhatsApp/email sending) — prefs are stored only.

## Verification
- Typecheck with `bunx tsgo --noEmit`.
- Manual: create a subscription with 3 installments from the client editor → record a payment → confirm portal Overview shows updated Paid / Next due, and the installment schedule reflects the new state. Toggle notification prefs, reset contact confirmation, and log into the portal to confirm the confirm-contact prompt reappears.