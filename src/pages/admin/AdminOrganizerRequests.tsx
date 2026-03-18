import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAllOrganizerRequests } from "@/hooks/use-organizer-requests";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function AdminOrganizerRequests() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useAllOrganizerRequests();
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
  const resolvedRequests = requests?.filter((r) => r.status !== "pending") || [];

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.functions.invoke("approve-organizer-request", {
        body: { request_id: requestId, action },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const req = requests?.find((r) => r.id === requestId);
      if (action === "approve") {
        toast.success(`Approved @${req?.username_requested} — organizer profile created!`);
      } else {
        toast.success(`Rejected @${req?.username_requested}`);
      }
      queryClient.invalidateQueries({ queryKey: ["all-organizer-requests"] });
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="secondary" className="text-green-700 bg-green-100">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizer Requests</h1>
          <p className="text-sm text-muted-foreground">Review and approve organizer profile requests.</p>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {/* Pending */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">@{req.username_requested}</p>
                      <p className="text-sm text-muted-foreground">{req.brand_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {req.instagram && (
                      <p className="text-muted-foreground">IG: <span className="text-foreground">{req.instagram}</span></p>
                    )}
                    {req.website && (
                      <p className="text-muted-foreground">Web: <a href={req.website.startsWith("http") ? req.website : `https://${req.website}`} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-0.5">{req.website} <ExternalLink className="w-3 h-3" /></a></p>
                    )}
                    {req.event_types && (
                      <p className="text-muted-foreground col-span-2">Types: <span className="text-foreground">{req.event_types}</span></p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, "approve")}
                      disabled={processing === req.id}
                      className="rounded-full gap-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {processing === req.id ? "Processing..." : "Approve"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-full gap-1 text-destructive border-destructive" disabled={processing === req.id}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject @{req.username_requested}?</AlertDialogTitle>
                          <AlertDialogDescription>This will deny their organizer request. They can submit a new one later.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleAction(req.id, "reject")}
                            className="rounded-full bg-destructive text-destructive-foreground"
                          >
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          </div>
        )}

        {/* Resolved */}
        {resolvedRequests.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">History</h2>
            <div className="space-y-2">
              {resolvedRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">@{req.username_requested}</p>
                    <p className="text-xs text-muted-foreground">{req.brand_name}</p>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
