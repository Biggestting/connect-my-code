import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, Trash2, Mail, Link2, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PromoterRow {
  id: string;
  display_name: string;
  promo_code: string;
  commission_percent: number;
  active: boolean;
  invite_status: string;
  invited_email: string | null;
  user_id: string | null;
  created_at: string;
}

export function PromotersSection({ organizerId }: { organizerId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commission, setCommission] = useState("10");
  const [isInviting, setIsInviting] = useState(false);

  const { data: promoters, isLoading } = useQuery({
    queryKey: ["promoters", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoterRow[];
    },
    enabled: !!organizerId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("invite-promoter", {
        body: {
          organizer_id: organizerId,
          email: email.trim().toLowerCase(),
          display_name: displayName.trim(),
          promo_code: promoCode.trim().toUpperCase(),
          commission_percent: Number(commission),
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["promoters", organizerId] });
      toast.success(data.message);
      setEmail("");
      setDisplayName("");
      setPromoCode("");
      setCommission("10");
      setIsInviting(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promoters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters", organizerId] });
      toast.success("Promoter removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim() || !promoCode.trim()) return;
    inviteMutation.mutate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-foreground">Promoters</CardTitle>
        {!isInviting && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInviting(true)}
            className="gap-1.5 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isInviting && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="promoter@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Promo Code</Label>
                <Input
                  placeholder="PROMO2026"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  required
                  className="h-9 text-sm uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Commission %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsInviting(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={inviteMutation.isPending}
                className="gradient-primary text-primary-foreground"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : !promoters?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No promoters yet. Invite your first promoter to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {promoters.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {p.display_name}
                    </span>
                    <Badge
                      variant={p.invite_status === "active" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {p.invite_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">
                      {p.promo_code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.commission_percent}%
                    </span>
                    {p.invited_email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {p.invited_email}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(p.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
