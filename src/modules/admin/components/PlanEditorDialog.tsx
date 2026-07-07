import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import type { PlanRecord } from "../types";

interface PlanEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanRecord | null;
  onSubmit: (payload: {
    id?: string;
    code: string;
    name: string;
    description: string | null;
    billingInterval: "monthly" | "annual";
    amountCents: number;
    currency: string;
    trialDays: number;
    taxRateBasisPoints: number;
    studentLimit: number | null;
    active: boolean;
    features: string[];
  }) => void;
}

export function PlanEditorDialog({ open, onOpenChange, plan, onSubmit }: PlanEditorDialogProps) {
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    code: "",
    name: "",
    description: "",
    billingInterval: "monthly" as "monthly" | "annual",
    amountCents: "0",
    currency: "XOF",
    trialDays: "0",
    taxRateBasisPoints: "1800",
    studentLimit: "",
    active: true,
    features: "dashboard-executif, paiements, facturation",
  });

  useEffect(() => {
    if (!plan) {
      setForm({ id: undefined, code: "", name: "", description: "", billingInterval: "monthly", amountCents: "0", currency: "XOF", trialDays: "0", taxRateBasisPoints: "1800", studentLimit: "", active: true, features: "dashboard-executif, paiements, facturation" });
      return;
    }
    setForm({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description ?? "",
      billingInterval: plan.billingInterval,
      amountCents: String(plan.amountCents),
      currency: plan.currency,
      trialDays: String(plan.trialDays),
      taxRateBasisPoints: String(plan.taxRateBasisPoints),
      studentLimit: plan.studentLimit ? String(plan.studentLimit) : "",
      active: plan.active,
      features: plan.features.join(", "),
    });
  }, [plan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Modifier le plan" : "Créer un plan"}</DialogTitle>
          <DialogDescription>Plans mensuels/annuels, essais, TVA et capacité.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Code" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
          <Input placeholder="Nom" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <Select value={form.billingInterval} onValueChange={(value) => setForm((prev) => ({ ...prev, billingInterval: value as "monthly" | "annual" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="annual">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Montant cents" value={form.amountCents} onChange={(event) => setForm((prev) => ({ ...prev, amountCents: event.target.value }))} />
          <Input placeholder="Devise" value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />
          <Input placeholder="Essai (jours)" value={form.trialDays} onChange={(event) => setForm((prev) => ({ ...prev, trialDays: event.target.value }))} />
          <Input placeholder="TVA basis points" value={form.taxRateBasisPoints} onChange={(event) => setForm((prev) => ({ ...prev, taxRateBasisPoints: event.target.value }))} />
          <Input placeholder="Limite élèves" value={form.studentLimit} onChange={(event) => setForm((prev) => ({ ...prev, studentLimit: event.target.value }))} />
        </div>

        <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        <Textarea placeholder="Fonctionnalités séparées par des virgules" value={form.features} onChange={(event) => setForm((prev) => ({ ...prev, features: event.target.value }))} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => {
              onSubmit({
                id: form.id,
                code: form.code,
                name: form.name,
                description: form.description || null,
                billingInterval: form.billingInterval,
                amountCents: Number(form.amountCents) || 0,
                currency: form.currency,
                trialDays: Number(form.trialDays) || 0,
                taxRateBasisPoints: Number(form.taxRateBasisPoints) || 0,
                studentLimit: form.studentLimit ? Number(form.studentLimit) : null,
                active: form.active,
                features: form.features.split(",").map((item) => item.trim()).filter(Boolean),
              });
            }}
          >
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}