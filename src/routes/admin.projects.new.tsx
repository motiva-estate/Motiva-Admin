import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/projects/new")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/projects/$id", params: { id: "new" } });
  },
});
