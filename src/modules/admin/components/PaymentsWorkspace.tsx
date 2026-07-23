import { Download, Eye, Filter, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import type { PaymentFilters, PaymentsPageResult } from "../types";
import { formatDateTime, formatMoney } from "../utils";

interface PaymentsWorkspaceProps {
  filters: PaymentFilters;
  setFilters: (updater: PaymentFilters | ((prev: PaymentFilters) => PaymentFilters)) => void;
  data?: PaymentsPageResult;
  loading: boolean;
  statusCounts: Record<string, number>;
  onOpenPayment: (paymentId: string) => void;
  onExport: () => void;
}

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "outline",
  failed: "destructive",
  refunded: "secondary",
  partially_refunded: "secondary",
  disputed: "destructive",
};

export function PaymentsWorkspace({ filters, setFilters, data, loading, statusCounts, onOpenPayment, onExport }: PaymentsWorkspaceProps) {
  const rows = data?.rows ?? [];
  const statusCards = ["paid", "pending", "failed", "refunded", "partially_refunded", "disputed"];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {statusCards.map((status) => (
          <Card key={status} className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm capitalize text-muted-foreground">{status.replaceAll("_", " ")}</p>
                <p className="text-2xl font-semibold">{statusCounts[status] ?? 0}</p>
              </div>
              <Badge variant={statusTone[status] ?? "outline"}>{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Recherche, filtres sauvegardables et export CSV</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setFilters((prev) => ({ ...prev, page: 1, search: "", status: "all", paymentMethod: "all", reconciliationStatus: "all" }))}>
              <RotateCcw className="h-4 w-4" /> Réinitialiser
            </Button>
            <Button onClick={onExport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="relative">
              <label htmlFor="payment_search" className="sr-only">Rechercher</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              <Input id="payment_search" name="search" className="pl-9" placeholder="Élève, parent, email" value={filters.search ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))} />
            </div>
            <Select value={filters.status ?? "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as PaymentFilters["status"], page: 1 }))}>
              <label htmlFor="payment_statusFilter" className="sr-only">Filtrer par statut</label>
              <SelectTrigger id="payment_statusFilter" name="statusFilter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partially_refunded">Partial refund</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.paymentMethod ?? "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, paymentMethod: value, page: 1 }))}>
              <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les canaux</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="card">Carte</SelectItem>
                <SelectItem value="bank_transfer">Virement</SelectItem>
                <SelectItem value="offline">Hors-ligne</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.reconciliationStatus ?? "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, reconciliationStatus: value as PaymentFilters["reconciliationStatus"], page: 1 }))}>
              <SelectTrigger><SelectValue placeholder="Rapprochement" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="manual_review">Manual review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Élève</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Aucune transaction sur ce filtre.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.studentName}</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">{row.invoiceNumber ?? "Sans facture"}</div>
                    </TableCell>
                    <TableCell>
                      <div>{row.parentName ?? "-"}</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">{row.parentEmail ?? "-"}</div>
                    </TableCell>
                    <TableCell>{formatMoney(row.amountCents, row.currency)}</TableCell>
                    <TableCell className="capitalize">{row.paymentMethod.replaceAll("_", " ")}</TableCell>
                    <TableCell><Badge variant={statusTone[row.status] ?? "outline"}>{row.status}</Badge></TableCell>
                    <TableCell>{row.classId ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => onOpenPayment(row.id)}>
                        <Eye className="h-4 w-4" /> Détail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
            <span>{data?.total ?? 0} transaction(s)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}>Précédent</Button>
              <span>Page {data?.page ?? 1}</span>
              <Button variant="outline" size="sm" disabled={rows.length < (filters.pageSize ?? 10)} onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}>Suivant</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}