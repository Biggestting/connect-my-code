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
import { UserPlus, Trash2, Mail, Link2, Copy, Check, CheckCircle, XCircle, Clock } from "lucide-react";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commission, setCommission] = useState("10");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCommission, setLinkCommission] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Pending promoter requests with profile lookup
  const { data: pendingRequests } = useQuery({
    queryKey: ["promoter-requests", organizerId],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("promoter_requests")
        .select("*")
        .eq("organizer_id", organizerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Look up profiles for each user
      const userIds = requests.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return requests.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      }));
    },
    enabled: !!organizerId,
  });

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const res = await supabase.functions.invoke("handle-promoter-request", {
        body: { request_id: requestId, action, commission_percent: 10 },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["promoter-requests", organizerId] });
      queryClient.invalidateQueries({ queryKey: ["promoters", organizerId] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from("promoter_invite_tokens")
        .insert({
          organizer_id: organizerId,
          commission_percent: Number(linkCommission),
          created_by: user!.id,
        })
        .select("token")
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/join/promoter/${data.token}`;
      setGeneratedLink(link);
      toast.success("Promoter invite link generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-foreground">Promoters</CardTitle>
        <div className="flex gap-2">
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate Promoter Link */}
        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Generate Promoter Link</span>
          </div>
          {generatedLink ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input value={generatedLink} readOnly className="h-9 text-xs font-mono flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1.5"
                >
                  {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {linkCopied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={() => { setGeneratedLink(null); setLinkCopied(false); }}
              >
                Generate new link
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Commission %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={linkCommission}
                  onChange={(e) => setLinkCommission(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="gradient-primary text-primary-foreground gap-1.5"
              >
                <Link2 className="h-3.5 w-3.5" />
                {isGenerating ? "Generating..." : "Generate Link"}
              </Button>
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Pending Requests ({pendingRequests.length})
              </span>
            </div>
            {pendingRequests.map((req: any) => {
              const name = req.profile?.display_name || req.user_id?.slice(0, 8);
              const reqEmail = req.profile?.email;
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    {email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleRequestAction(req.id, "approve")}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRequestAction(req.id, "reject")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
