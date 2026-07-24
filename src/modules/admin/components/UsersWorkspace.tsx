import { startTransition, useMemo, useState } from "react";
import { Download, KeyRound, PauseCircle, Plus, Search, Trash2, Upload, UserCheck } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Textarea } from "@/app/components/ui/textarea";
import type { AdminUserDetail, AdminUserFilters, AdminUsersPageResult } from "../types";
import { formatDateTime } from "../utils";

interface UsersWorkspaceProps {
  filters: AdminUserFilters;
  setFilters: (updater: AdminUserFilters | ((prev: AdminUserFilters) => AdminUserFilters)) => void;
  data?: AdminUsersPageResult;
  loading: boolean;
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  selectedUser?: AdminUserDetail;
  detailLoading: boolean;
  busy: boolean;
  onCreateUser: (payload: {
    email: string;
    fullName: string;
    roleCode: "owner" | "super_admin" | "admin_finance" | "support" | "director";
    status: "active" | "suspended" | "pending_invite";
    countryCode: string;
    acquisitionChannel: string;
    sendInvite: boolean;
  }) => void;
  onUpdateUser: (payload: {
    userId: string;
    fullName?: string;
    roleCode?: "owner" | "super_admin" | "admin_finance" | "support" | "director";
    status?: "active" | "suspended" | "pending_invite" | "deleted";
    countryCode?: string;
    acquisitionChannel?: string;
    suspendedReason?: string;
  }) => void;
  onSuspendUser: (payload: { userId: string; reason: string }) => void;
  onReactivateUser: (payload: { userId: string; reason?: string }) => void;
  onResetPassword: (payload: { userId: string }) => void;
  onDeleteUser: (payload: { userId: string; reason?: string }) => void;
  onImportCsv: (payload: { csv: string }) => void;
  onExportCsv: () => void;
}

function statusTone(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "suspended" || status === "deleted") return "destructive";
  if (status === "pending_invite") return "secondary";
  return "outline";
}

export function UsersWorkspace({
  filters,
  setFilters,
  data,
  loading,
  selectedUserId,
  onSelectUser,
  selectedUser,
  detailLoading,
  busy,
  onCreateUser,
  onUpdateUser,
  onSuspendUser,
  onReactivateUser,
  onResetPassword,
  onDeleteUser,
  onImportCsv,
  onExportCsv,
}: UsersWorkspaceProps) {
  type CreateUserPayload = Parameters<UsersWorkspaceProps["onCreateUser"]>[0];

  const [section, setSection] = useState("liste");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    email: "",
    fullName: "",
    roleCode: "support",
    status: "active",
    countryCode: "SN",
    acquisitionChannel: "direct",
    sendInvite: true,
  });
  const [csvPayload, setCsvPayload] = useState("email,fullName,roleCode,status,countryCode,acquisitionChannel\n");
  const [suspendReason, setSuspendReason] = useState("Suspension administrative");
  const [deleteReason, setDeleteReason] = useState("Suppression demandée par l'administration");

  const rows = data?.rows ?? [];
  const userCountLabel = useMemo(() => `${data?.total ?? 0} utilisateur(s)`, [data?.total]);

  return (
    <div className="space-y-4">
      <Tabs value={section} onValueChange={setSection} className="space-y-4">
        <TabsList className="w-full justify-start overflow-auto rounded-2xl border border-slate-200/70 bg-white/90 p-1 dark:border-slate-800 dark:bg-slate-950/80">
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="fiche">Fiche utilisateur</TabsTrigger>
          <TabsTrigger value="importation">Création et import</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Gestion des utilisateurs SaaS</CardTitle>
                <CardDescription>Recherche, filtres, table et pagination.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onExportCsv}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => startTransition(() => setImportOpen(true))}>
                  <Upload className="h-4 w-4" /> Importer un CSV
                </Button>
                <Button onClick={() => startTransition(() => setCreateOpen(true))}>
                  <Plus className="h-4 w-4" /> Nouvel utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div className="relative">
                  <label htmlFor="users_search" className="sr-only">Rechercher</label>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                  <Input
                    id="users_search"
                    name="search"
                    className="pl-9"
                    placeholder="Rechercher nom/email"
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
                  />
                </div>
                <div>
                  <label htmlFor="users_statusFilter" className="sr-only">Filtrer par statut</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as AdminUserFilters["status"], page: 1 }))}>
                    <SelectTrigger id="users_statusFilter" name="statusFilter"><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="pending_invite">Invitation en attente</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                      <SelectItem value="deleted">Supprimé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="users_roleFilter" className="sr-only">Filtrer par rôle</label>
                  <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value as AdminUserFilters["role"], page: 1 }))}>
                    <SelectTrigger id="users_roleFilter" name="roleFilter"><SelectValue placeholder="Rôle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="super_admin">Super admin</SelectItem>
                      <SelectItem value="admin_finance">Admin finance</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="users_sortFilter" className="sr-only">Trier par</label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value as AdminUserFilters["sortBy"], page: 1 }))}>
                    <SelectTrigger id="users_sortFilter" name="sortFilter"><SelectValue placeholder="Tri" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Création</SelectItem>
                      <SelectItem value="last_seen_at">Dernière activité</SelectItem>
                      <SelectItem value="full_name">Nom</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="status">Statut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Dernière activité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!loading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                      </TableRow>
                    )}
                    {rows.map((row) => (
                      <TableRow
                        key={row.userId}
                        className={selectedUserId === row.userId ? "bg-slate-100/80 dark:bg-slate-900/70" : ""}
                        onClick={() => onSelectUser(row.userId)}
                      >
                        <TableCell className="font-medium">{row.fullName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.roleCode}</TableCell>
                        <TableCell><Badge variant={statusTone(row.status)}>{row.status}</Badge></TableCell>
                        <TableCell>{row.countryCode}</TableCell>
                        <TableCell>{row.acquisitionChannel}</TableCell>
                        <TableCell>{formatDateTime(row.lastSeenAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                <span>{userCountLabel}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  >
                    Précédent
                  </Button>
                  <span>Page {data?.page ?? filters.page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={rows.length < filters.pageSize}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiche" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Détail utilisateur</CardTitle>
              <CardDescription>Actions administratives et traçabilité.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedUserId && <p className="text-sm text-slate-700 dark:text-slate-300">Sélectionnez un utilisateur pour afficher sa fiche.</p>}
              {selectedUserId && detailLoading && <p className="text-sm text-slate-700 dark:text-slate-300">Chargement de la fiche utilisateur...</p>}
              {selectedUser && (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-700 dark:text-slate-300">Nom</p>
                      <p className="font-medium">{selectedUser.fullName}</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-700 dark:text-slate-300">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-700 dark:text-slate-300">Rôle</p>
                      <p className="font-medium">{selectedUser.roleCode}</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-700 dark:text-slate-300">Statut</p>
                      <p className="font-medium">{selectedUser.status}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <Button
                      variant="outline"
                      disabled={busy || selectedUser.status === "suspended"}
                      onClick={() => onSuspendUser({ userId: selectedUser.userId, reason: suspendReason })}
                    >
                      <PauseCircle className="h-4 w-4" /> Suspendre
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || selectedUser.status === "active"}
                      onClick={() => onReactivateUser({ userId: selectedUser.userId, reason: "Réactivation admin" })}
                    >
                      <UserCheck className="h-4 w-4" /> Réactiver
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => onResetPassword({ userId: selectedUser.userId })}>
                      <KeyRound className="h-4 w-4" /> Reset mot de passe
                    </Button>
                    <Button variant="destructive" disabled={busy} onClick={() => onDeleteUser({ userId: selectedUser.userId, reason: deleteReason })}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="suspend-reason">Motif suspension</Label>
                      <Input id="suspend-reason" value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="delete-reason">Motif suppression</Label>
                      <Input id="delete-reason" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Journal d’audit utilisateur</h3>
                    <div className="max-h-52 space-y-2 overflow-auto rounded-xl border p-3">
                      {selectedUser.auditTrail.length === 0 && <p className="text-sm text-slate-700 dark:text-slate-300">Aucun événement pour cet utilisateur.</p>}
                      {selectedUser.auditTrail.map((entry) => (
                        <div key={entry.id} className="rounded-lg border p-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{entry.action}</span>
                            <Badge variant={entry.severity === "critical" ? "destructive" : entry.severity === "warn" ? "outline" : "secondary"}>{entry.severity}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="importation" className="space-y-4">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Création et import</CardTitle>
                <CardDescription>Accès direct aux flux de provisioning et d’import CSV.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => startTransition(() => setImportOpen(true))}>
                  <Upload className="h-4 w-4" /> Importer un CSV
                </Button>
                <Button onClick={() => startTransition(() => setCreateOpen(true))}>
                  <Plus className="h-4 w-4" /> Nouvel utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Création rapide</h3>
                <p className="mt-1 text-sm text-muted-foreground">Ouvre le formulaire de provisioning avec rôle, statut, pays et canal d’acquisition.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Import massif</h3>
                <p className="mt-1 text-sm text-muted-foreground">Ouvre la boîte d’import avec le gabarit CSV attendu pour les ajouts en lot.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>Provisioning + rôle + statut + canal d'acquisition.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="create-fullname">Nom complet</Label>
              <Input id="create-fullname" value={createForm.fullName} onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))} />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Rôle</Label>
                <Select value={createForm.roleCode} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, roleCode: value as "owner" | "super_admin" | "admin_finance" | "support" | "director" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="super_admin">Super admin</SelectItem>
                    <SelectItem value="admin_finance">Admin finance</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={createForm.status} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as "active" | "suspended" | "pending_invite" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="pending_invite">Invitation en attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="create-country">Pays</Label>
                <Input id="create-country" value={createForm.countryCode} onChange={(event) => setCreateForm((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))} />
              </div>
              <div>
                <Label htmlFor="create-channel">Canal acquisition</Label>
                <Input id="create-channel" value={createForm.acquisitionChannel} onChange={(event) => setCreateForm((prev) => ({ ...prev, acquisitionChannel: event.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => startTransition(() => setCreateOpen(false))}>Annuler</Button>
            <Button
              onClick={() => {
                onCreateUser(createForm);
                startTransition(() => {
                  setCreateOpen(false);
                  setCreateForm({
                    email: "",
                    fullName: "",
                    roleCode: "support",
                    status: "active",
                    countryCode: "SN",
                    acquisitionChannel: "direct",
                    sendInvite: true,
                  });
                });
              }}
              disabled={busy || !createForm.email || !createForm.fullName}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer des utilisateurs depuis un CSV</DialogTitle>
            <DialogDescription>Colonnes attendues: email, fullName, roleCode, status, countryCode, acquisitionChannel.</DialogDescription>
          </DialogHeader>
          <Textarea id="users_csvPayload" name="csvPayload" rows={10} value={csvPayload} onChange={(event) => setCsvPayload(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => startTransition(() => setImportOpen(false))}>Annuler</Button>
            <Button
              onClick={() => {
                onImportCsv({ csv: csvPayload });
                startTransition(() => setImportOpen(false));
              }}
              disabled={busy || !csvPayload.trim()}
            >
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
