import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { Client } from "@/lib/api/types";

export const Route = createFileRoute("/admin/clients/import")({
  component: ClientImport,
});

const HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "contactAddress",
  "nokFirstName",
  "nokLastName",
  "nokPhone",
  "nokAddress",
  "termsAccepted",
  "signatureName",
  "signatureDate",
] as const;

type Row = {
  data: Partial<Client>;
  display: { name: string; email: string };
  error?: string;
};

function parseCsv(text: string): string[][] {
  // Minimal CSV parser handling quoted fields with commas.
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

function ClientImport() {
  const template = HEADERS.join(",") + "\n" +
    "Ada,Example,ada@example.com,+2348010000000,12 Marina Lagos,John,Example,+2348020000000,12 Marina Lagos,true,Ada Example,2025-01-15\n" +
    "Chinedu,Test,chinedu@example.com,,,,,,,false,,";
  const [csv, setCsv] = useState(template);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);

  const validate = () => {
    const parsed = parseCsv(csv);
    if (parsed.length === 0) { setRows([]); return; }
    const header = parsed[0].map((h) => h.trim());
    const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const body = parsed.slice(1);

    const out: Row[] = body.map((cols) => {
      const get = (name: string) => {
        const i = idx(name);
        return i >= 0 ? (cols[i] ?? "").trim() : "";
      };
      const firstName = get("firstName");
      const lastName = get("lastName");
      const email = get("email");
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

      let error: string | undefined;
      if (!firstName && !lastName) error = "Missing name";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Invalid email";

      const termsRaw = get("termsAccepted").toLowerCase();
      const termsAccepted = termsRaw === "true" || termsRaw === "yes" || termsRaw === "1";

      const data: Partial<Client> = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        fullName,
        email,
        phone: get("phone") || undefined,
        contactAddress: get("contactAddress") || undefined,
        nextOfKin: {
          firstName: get("nokFirstName") || undefined,
          lastName: get("nokLastName") || undefined,
          phone: get("nokPhone") || undefined,
          address: get("nokAddress") || undefined,
        },
        termsAccepted,
        signatureName: get("signatureName") || undefined,
        signatureDate: get("signatureDate") || undefined,
        source: "BULK_IMPORT",
        status: "LEAD",
      };
      return { data, display: { name: fullName || "(no name)", email }, error };
    });
    setRows(out);
  };

  const commit = async () => {
    const valid = rows.filter((r) => !r.error);
    setImporting(true);
    try {
      for (const r of valid) {
        await api.clients.create(r.data);
      }
      toast.success(`Imported ${valid.length} client${valid.length === 1 ? "" : "s"}`);
      setRows([]);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
  };

  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Bulk import clients"
        description="Upload or paste CSV rows matching the subscription form. Validate first, then commit."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>Download template</Button>
        }
      />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
              className="text-sm"
            />
            <span className="text-xs text-muted-foreground">
              Columns: {HEADERS.join(", ")}
            </span>
          </div>
          <Textarea rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={validate}>Validate</Button>
            <Button onClick={commit} disabled={rows.length === 0 || validCount === 0 || importing}>
              {importing ? "Importing…" : `Import ${validCount} row${validCount === 1 ? "" : "s"}`}
            </Button>
          </div>
          {rows.length > 0 && (
            <div className="rounded-md border border-border">
              <div className="border-b border-border bg-muted/40 px-3 py-2 text-sm">
                {validCount} valid, {errorCount} with errors
              </div>
              <ul className="divide-y divide-border">
                {rows.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{r.display.name}</span>{" "}
                      <span className="text-muted-foreground">{r.display.email}</span>
                    </span>
                    {r.error ? (
                      <span className="text-destructive text-xs">{r.error}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">OK</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
