import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAction } from "@/hooks/use-platform";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, User, MoreVertical, ShieldOff, ShieldCheck, Ban } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-orange-100 text-orange-700",
  banned: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const adminAction = useAdminAction();
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: "", description: "", onConfirm: () => {},
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = users?.filter((u: any) =>
    u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search.toLowerCase())
  );

  const changeStatus = (user: any, newStatus: string, actionLabel: string) => {
    setConfirmDialog({
      open: true,
      title: actionLabel,
      description: `Are you sure you want to ${actionLabel.toLowerCase()} "${user.display_name || 'this user'}"?${
        newStatus === "suspended" ? " They won't be able to buy tickets or interact with the marketplace." :
        newStatus === "banned" ? " This permanently restricts their account." : ""
      }`,
      onConfirm: async () => {
        try {
          await adminAction.mutateAsync({
            action: `user_${newStatus}`,
            targetType: "user",
            targetId: user.user_id,
            details: { display_name: user.display_name, previous_status: user.status },
            execute: async () => {
              const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("user_id", user.user_id);
              if (error) throw error;
            },
          });
          toast.success(`User is now ${newStatus}`);
          queryClient.invalidateQueries({ queryKey: ["admin-users-full"] });
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-xl font-bold text-foreground mb-1">User Management</h1>
        <p className="text-sm text-muted-foreground mb-5">{users?.length || 0} users</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered?.map((user: any) => (
              <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                user.status === "banned" ? "border-destructive/30 bg-destructive/5" :
                user.status === "suspended" ? "border-orange-300 bg-orange-50/50" :
                "border-border hover:bg-muted/50"
              }`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{user.display_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[user.city, user.country].filter(Boolean).join(", ") || "No location"} · Joined {format(new Date(user.created_at), "MMM yyyy")}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[user.status] || statusColors.active}`}>
                  {user.status || "active"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.status !== "active" && (
                      <DropdownMenuItem onClick={() => changeStatus(user, "active", "Unsuspend User")}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Activate
                      </DropdownMenuItem>
                    )}
                    {user.status !== "suspended" && (
                      <DropdownMenuItem onClick={() => changeStatus(user, "suspended", "Suspend User")}>
                        <ShieldOff className="w-3.5 h-3.5 mr-2" /> Suspend
                      </DropdownMenuItem>
                    )}
                    {user.status !== "banned" && (
                      <DropdownMenuItem onClick={() => changeStatus(user, "banned", "Ban User")} className="text-destructive">
                        <Ban className="w-3.5 h-3.5 mr-2" /> Ban
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>}
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
