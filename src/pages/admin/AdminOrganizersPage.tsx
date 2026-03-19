import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAction } from "@/hooks/use-platform";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Users, MoreVertical, Snowflake, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  frozen: "bg-blue-100 text-blue-700",
};

export default function AdminOrganizersPage() {
  const queryClient = useQueryClient();
  const adminAction = useAdminAction();
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: "", description: "", onConfirm: () => {},
  });

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["admin-organizers-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = organizers?.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const changeStatus = (org: any, newStatus: string, actionLabel: string) => {
    setConfirmDialog({
      open: true,
      title: actionLabel,
      description: `Are you sure you want to ${actionLabel.toLowerCase()} "${org.name}"?${
        newStatus === "frozen" ? " They won't be able to create or edit events, and their ticket sales will be paused." : ""
      }`,
      onConfirm: async () => {
        try {
          await adminAction.mutateAsync({
            action: `organizer_${newStatus}`,
            targetType: "organizer",
            targetId: org.id,
            details: { name: org.name, previous_status: org.status },
            execute: async () => {
              const { error } = await supabase.from("organizers").update({ status: newStatus }).eq("id", org.id);
              if (error) throw error;
            },
          });
          toast.success(`${org.name} is now ${newStatus}`);
          queryClient.invalidateQueries({ queryKey: ["admin-organizers-full"] });
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  const deleteOrganizer = (org: any) => {
    setConfirmDialog({
      open: true,
      title: "Delete Organizer",
      description: `Are you sure you want to delete "${org.name}" (@${org.slug})? This will remove their organizer profile and members. They can reapply in the future.`,
      onConfirm: async () => {
        try {
          await adminAction.mutateAsync({
            action: "delete_organizer",
            targetType: "organizer",
            targetId: org.id,
            details: { name: org.name, slug: org.slug },
            execute: async () => {
              // Delete members first, then organizer
              await supabase.from("organizer_members").delete().eq("organizer_id", org.id);
              const { error } = await supabase.from("organizers").delete().eq("id", org.id);
              if (error) throw error;
            },
          });
          toast.success(`${org.name} has been deleted`);
          queryClient.invalidateQueries({ queryKey: ["admin-organizers-full"] });
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Organizer Management</h1>
        <p className="text-sm text-muted-foreground mb-5">{organizers?.length || 0} organizers</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizers..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered?.map((org: any) => (
              <div key={org.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                org.status === "frozen" ? "border-blue-300 bg-blue-50/50" :
                "border-border hover:bg-muted/50"
              }`}>
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{org.slug} · {org.events_count} events · {org.follower_count} followers
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[org.status] || statusColors.active}`}>
                  {org.status || "active"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {org.status !== "active" && (
                      <DropdownMenuItem onClick={() => changeStatus(org, "active", "Activate Organizer")}>
                        <Play className="w-3.5 h-3.5 mr-2" /> Activate
                      </DropdownMenuItem>
                    )}
                    {org.status !== "frozen" && (
                      <DropdownMenuItem onClick={() => changeStatus(org, "frozen", "Freeze Organizer")}>
                        <Snowflake className="w-3.5 h-3.5 mr-2" /> Freeze
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => deleteOrganizer(org)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No organizers found.</p>}
          </div>
        )}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
