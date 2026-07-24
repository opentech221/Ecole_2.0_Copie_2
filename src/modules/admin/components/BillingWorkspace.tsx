import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import type { BillingSnapshot, PlanRecord } from "../types";
import { formatDateTime, formatMoney } from "../utils";

interface BillingWorkspaceProps {
  data?: BillingSnapshot;
  onCreatePlan: () => void;
  onEditPlan: (plan: PlanRecord) => void;
}

export function BillingWorkspace({ data, onCreatePlan, onEditPlan }: BillingWorkspaceProps) {
  const plans = data?.plans ?? [];
  const invoices = data?.invoices ?? [];
  const subscriptions = data?.subscriptions ?? [];
  const [section, setSection] = useState("plans");

  return (
    <div className="space-y-4">
      <Tabs value={section} onValueChange={setSection} className="space-y-4">
        <TabsList className="w-full justify-start overflow-auto rounded-3xl border border-slate-300/80 bg-white/95 p-1.5 shadow-sm shadow-slate-950/5 backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/90 dark:shadow-black/20">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Plans</CardTitle>
                <CardDescription>Mensuel, annuel, essais, taxes et limites</CardDescription>
              </div>
              <Button onClick={onCreatePlan}><Plus className="h-4 w-4" /> Nouveau plan</Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <button key={plan.id} onClick={() => onEditPlan(plan)} className="rounded-2xl border p-4 text-left transition hover:border-slate-500 dark:hover:border-slate-600">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">{plan.code}</p>
                    </div>
                    <Badge variant={plan.active ? "default" : "outline"}>{plan.active ? "Actif" : "Inactif"}</Badge>
                  </div>
                  <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">{plan.description ?? "Aucune description"}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-semibold">{formatMoney(plan.amountCents, plan.currency)}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{plan.billingInterval} • essai {plan.trialDays} j</p>
                    </div>
                    <div className="text-right text-xs text-slate-700 dark:text-slate-300">
                      <div>TVA {plan.taxRateBasisPoints / 100}%</div>
                      <div>{plan.studentLimit ?? "∞"} élèves</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Abonnements à surveiller</CardTitle>
              <CardDescription>Prorata, upgrades/downgrades, résiliation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-2xl border p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{subscription.subscriberName}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{subscription.planName ?? "Sans plan"}</p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : subscription.status === "past_due" ? "destructive" : "outline"}>{subscription.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                    <span>{formatMoney(subscription.amountCents, subscription.currency)}</span>
                    <span>{formatDateTime(subscription.currentPeriodEnd)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Factures récentes</CardTitle>
              <CardDescription>Numérotation, échéances, soldes et statuts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facture</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.studentName}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{formatMoney(invoice.totalCents, invoice.currency)}</TableCell>
                      <TableCell>{formatMoney(invoice.balanceCents, invoice.currency)}</TableCell>
                      <TableCell><Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "outline"}>{invoice.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}