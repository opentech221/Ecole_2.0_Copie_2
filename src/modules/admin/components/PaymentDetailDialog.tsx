import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { formatDateTime, formatMoney } from "../utils";
import type { PaymentDetail } from "../types";

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentDetail;
  busy?: boolean;
  onRefund: (amountCents: number, reason: string) => void;
  onReminder: (message: string) => void;
  onOffline: (note: string) => void;
  onCancel: () => void;
  onSaveNote: (note: string) => void;
}

export function PaymentDetailDialog({ open, onOpenChange, payment, busy, onRefund, onReminder, onOffline, onCancel, onSaveNote }: PaymentDetailDialogProps) {
  const [note, setNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Ajustement administratif");
  const [reminderMessage, setReminderMessage] = useState("Bonjour, votre paiement est attendu. Merci de régulariser avant l’échéance.");
  const [offlineNote, setOfflineNote] = useState("Paiement reçu hors ligne et confirmé par l’administration.");

  useEffect(() => {
    setNote(payment?.internalNotes ?? "");
    setRefundAmount(payment ? String(payment.amountCents) : "");
  }, [payment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Détail transaction</DialogTitle>
          <DialogDescription>Remboursement, relance, rapprochement et notes internes.</DialogDescription>
        </DialogHeader>

        {!payment && <div className="text-sm text-muted-foreground">Chargement…</div>}

        {payment && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Élève</p>
                  <p className="font-medium">{payment.studentName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Parent</p>
                  <p className="font-medium">{payment.parentName ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">{payment.parentEmail ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant</p>
                  <p className="font-medium">{formatMoney(payment.amountCents, payment.currency)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Statut</p>
                  <Badge variant={payment.status === "paid" ? "default" : payment.status === "failed" ? "destructive" : "outline"}>{payment.status}</Badge>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Facture</p>
                  <p className="font-medium">{payment.invoiceNumber ?? "Sans facture"}</p>
                  <p className="text-sm text-muted-foreground">{payment.invoiceStatus ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Abonnement</p>
                  <p className="font-medium">{payment.subscriptionStatus ?? "-"}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="mb-3 font-medium">Tentatives</p>
                  <div className="space-y-3 text-sm">
                    {payment.attempts.map((attempt) => (
                      <div key={attempt.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">#{attempt.attemptNumber} · {attempt.provider}</span>
                          <Badge variant={attempt.status === "failed" ? "destructive" : "secondary"}>{attempt.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{attempt.responseMessage ?? attempt.responseCode ?? "Aucune réponse"}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(attempt.attemptedAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="mb-3 font-medium">Remboursements</p>
                  <div className="space-y-3 text-sm">
                    {payment.refunds.length === 0 && <p className="text-muted-foreground">Aucun remboursement</p>}
                    {payment.refunds.map((refund) => (
                      <div key={refund.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{formatMoney(refund.amountCents, payment.currency)}</span>
                          <Badge variant={refund.status === "failed" ? "destructive" : "secondary"}>{refund.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{refund.reason ?? "Sans motif"}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(refund.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border p-4">
                <p className="mb-3 font-medium">Actions critiques</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="payment_refundAmount" className="text-sm font-medium">Remboursement</label>
                    <Input id="payment_refundAmount" name="refundAmount" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder="Montant en cents" />
                    <Input id="payment_refundReason" name="refundReason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Motif" />
                    <Button className="w-full" disabled={busy} onClick={() => onRefund(Number(refundAmount) || 0, refundReason)}>Rembourser</Button>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payment_reminderMessage" className="text-sm font-medium">Relance</label>
                    <Textarea id="payment_reminderMessage" name="reminderMessage" value={reminderMessage} onChange={(event) => setReminderMessage(event.target.value)} />
                    <Button variant="outline" className="w-full" disabled={busy} onClick={() => onReminder(reminderMessage)}>Envoyer une relance</Button>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payment_offlineNote" className="text-sm font-medium">Paiement hors-ligne</label>
                    <Textarea id="payment_offlineNote" name="offlineNote" value={offlineNote} onChange={(event) => setOfflineNote(event.target.value)} />
                    <Button variant="outline" className="w-full" disabled={busy} onClick={() => onOffline(offlineNote)}>Marquer payé hors-ligne</Button>
                  </div>
                  <Button variant="destructive" className="w-full" disabled={busy} onClick={onCancel}>Annuler la transaction</Button>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <label htmlFor="payment_internalNote" className="mb-3 font-medium display-block">Notes internes</label>
                <Textarea id="payment_internalNote" name="internalNote" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28" />
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" disabled={busy} onClick={() => onSaveNote(note)}>Enregistrer la note</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}