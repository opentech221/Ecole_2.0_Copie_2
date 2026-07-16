import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import type { AuditResult } from "../types";
import { formatDateTime } from "../utils";

interface AuditWorkspaceProps {
  data?: AuditResult;
}

export function AuditWorkspace({ data }: AuditWorkspaceProps) {
  const rows = data?.rows ?? [];

  return (
    <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader>
        <CardTitle>Journal d’audit</CardTitle>
        <CardDescription>Traçabilité complète des actions critiques, support et conformité RGPD-ready</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.action}</div>
                  <div className="text-xs text-muted-foreground">{JSON.stringify(row.metadata)}</div>
                </TableCell>
                <TableCell>{row.entityType}</TableCell>
                <TableCell>{row.actorRole ?? "-"}</TableCell>
                <TableCell><Badge variant={row.severity === "critical" ? "destructive" : row.severity === "warn" ? "outline" : "secondary"}>{row.severity}</Badge></TableCell>
                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}