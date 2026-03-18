import { useState } from "react";
import { usePromoterSales, usePromoterCommissions, useBulkMarkPaid, useCreatePromoter, useDeletePromoter, type PromoterWithStats } from "@/hooks/use-promoters";
import { DollarSign, Ticket, Users, Plus, Trash2, Link2, Trophy, Medal, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PromotersTabProps {
  organizerId: string;
  organizerSlug: string;
}

export function PromotersTab({ organizerId, organizerSlug }: PromotersTabProps) {
  const { data: promoters, isLoading } = usePromoterSales(organizerId);
  const { data: commissions } = usePromoterCommissions(organizerId);

  const totalPromoterRevenue = promoters?.reduce((s, p) => s + p.revenue_generated, 0) || 0;
  const totalPromoterTickets = promoters?.reduce((s, p) => s + p.tickets_sold, 0) || 0;
  const totalCommission = promoters?.reduce((s, p) => s + p.commission_earned, 0) || 0;
  const pendingCommission = commissions?.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
  const paidCommission = commissions?.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0) || 0;

  return (
    <div className="px-4 py-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Promoters</h2>
        <AddPromoterDialog organizerId={organizerId} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{promoters?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Active Promoters</p>
        </div>
        <div className="p-3 rounded-xl border border-border text-center">
          <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalPromoterTickets}</p>
          <p className="text-[10px] text-muted-foreground">Tickets via Promos</p>
        </div>
        <div className="p-3 rounded-xl border border-border text-center">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">${totalCommission.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Commission</p>
        </div>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4 pt-4">
          <LeaderboardView promoters={promoters || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 pt-4">
          <ManageView promoters={promoters || []} organizerId={organizerId} organizerSlug={organizerSlug} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4 pt-4">
          <PayoutsView
            promoters={promoters || []}
            organizerId={organizerId}
            pendingCommission={pendingCommission}
            paidCommission={paidCommission}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Leaderboard ─── */

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardView({ promoters, isLoading }: { promoters: PromoterWithStats[]; isLoading: boolean }) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const sorted = [...promoters].sort((a, b) => b.tickets_sold - a.tickets_sold);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No promoters yet. Add promoters to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            i === 0 ? "border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10" :
            i === 1 ? "border-slate-300/50 bg-slate-50/30 dark:bg-slate-800/10" :
            i === 2 ? "border-amber-600/30 bg-amber-50/30 dark:bg-amber-900/10" :
            "border-border"
          }`}
        >
          <span className="text-lg w-8 text-center font-bold">
            {i < 3 ? RANK_MEDALS[i] : <span className="text-sm text-muted-foreground">{i + 1}</span>}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{p.display_name}</p>
            <p className="text-xs text-muted-foreground">{p.promo_code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">{p.tickets_sold} tickets</p>
            <p className="text-xs text-muted-foreground">${p.revenue_generated.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Manage ─── */

function ManageView({ promoters, organizerId, organizerSlug, isLoading }: {
  promoters: PromoterWithStats[];
  organizerId: string;
  organizerSlug: string;
  isLoading: boolean;
}) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (promoters.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No promoters yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add promoters to track referral sales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {promoters.map((promoter) => (
        <PromoterRow key={promoter.id} promoter={promoter} organizerId={organizerId} organizerSlug={organizerSlug} />
      ))}
    </div>
  );
}

function PromoterRow({ promoter, organizerId, organizerSlug }: {
  promoter: PromoterWithStats;
  organizerId: string;
  organizerSlug: string;
}) {
  const deletePromoter = useDeletePromoter();
  const promoLink = `${window.location.origin}/organizers/${organizerSlug}?p=${promoter.promo_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(promoLink);
    toast.success("Promo link copied!");
  };

  return (
    <div className="p-4 rounded-xl border border-border space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{promoter.display_name}</p>
            <Badge variant="secondary" className="text-[10px]">{promoter.promo_code}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{promoter.commission_percent}% commission</p>
        </div>
        <div className="flex gap-1">
          <button onClick={copyLink} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors" title="Copy promo link">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {promoter.display_name}?</AlertDialogTitle>
                <AlertDialogDescription>This won't affect existing sales records.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deletePromoter.mutate({ id: promoter.id, organizerId });
                    toast.success("Promoter removed");
                  }}
                  className="rounded-full bg-destructive text-destructive-foreground"
                >Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Tickets</p>
          <p className="font-bold text-foreground">{promoter.tickets_sold}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Revenue</p>
          <p className="font-bold text-foreground">${promoter.revenue_generated.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Commission</p>
          <p className="font-bold text-foreground">${promoter.commission_earned.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Payouts ─── */

function PayoutsView({ promoters, organizerId, pendingCommission, paidCommission }: {
  promoters: PromoterWithStats[];
  organizerId: string;
  pendingCommission: number;
  paidCommission: number;
}) {
  const bulkMarkPaid = useBulkMarkPaid();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-foreground">${pendingCommission.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-bold text-foreground">${paidCommission.toLocaleString()}</p>
        </div>
      </div>

      {promoters.filter(p => p.commission_earned > 0).length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No commissions to show yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promoters.filter(p => p.commission_earned > 0).map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{p.display_name}</p>
                <p className="text-xs text-muted-foreground">{p.tickets_sold} tickets · ${p.commission_earned.toLocaleString()} earned</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" /> Mark Paid
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark all pending commissions as paid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark all pending commissions for {p.display_name} as paid.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        bulkMarkPaid.mutate([p.id] as any);
                        toast.success(`Marked ${p.display_name}'s commissions as paid`);
                      }}
                      className="rounded-full"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add Promoter Dialog ─── */

function AddPromoterDialog({ organizerId }: { organizerId: string }) {
  const [open, setOpen] = useState(false);
  const createPromoter = useCreatePromoter();
  const [form, setForm] = useState({
    displayName: "",
    promoCode: "",
    commissionPercent: "10",
  });

  const handleSubmit = async () => {
    if (!form.displayName.trim() || !form.promoCode.trim()) {
      toast.error("Name and promo code are required");
      return;
    }
    try {
      await createPromoter.mutateAsync({
        organizerId,
        displayName: form.displayName.trim(),
        promoCode: form.promoCode.trim(),
        commissionPercent: Number(form.commissionPercent) || 10,
      });
      toast.success("Promoter added!");
      setOpen(false);
      setForm({ displayName: "", promoCode: "", commissionPercent: "10" });
    } catch (err: any) {
      toast.error(err.message || "Failed to add promoter");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1">
          <Plus className="w-4 h-4" /> Add Promoter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Promoter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Display Name *</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="DJ Trini"
            />
          </div>
          <div className="space-y-2">
            <Label>Promo Code *</Label>
            <Input
              value={form.promoCode}
              onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))}
              placeholder="DJTRINI"
            />
            <p className="text-xs text-muted-foreground">Uppercase, no spaces. Used in referral links.</p>
          </div>
          <div className="space-y-2">
            <Label>Commission %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.commissionPercent}
              onChange={(e) => setForm((p) => ({ ...p, commissionPercent: e.target.value }))}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createPromoter.isPending}
            className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11"
          >
            {createPromoter.isPending ? "Adding..." : "Add Promoter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
