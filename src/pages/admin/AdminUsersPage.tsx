import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAction } from "@/hooks/use-platform";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, MoreVertical, ShieldOff, ShieldCheck, Ban, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-orange-100 text-orange-700",
  banned: "bg-red-100 text-red-700",
};

const initialCreateForm = {
  email: "",
  password: "",
  display_name: "",
  first_name: "",
  last_name: "",
  city: "",
  country: "",
  phone_number: "",
  role: "user",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const adminAction = useAdminAction();
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [creating, setCreating] = useState(false);
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
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
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

  const updateField = (field: string, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("Email and password are required");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      const res = await supabase.functions.invoke("create-user", {
        body: createForm,
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success(`User "${createForm.display_name || createForm.email}" created successfully`);
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
      queryClient.invalidateQueries({ queryKey: ["admin-users-full"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="rounded-full gap-1.5">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{users?.length || 0} users</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or ID..." className="pl-9" />
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
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email && <span>{user.email} · </span>}
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Create a user account directly — no email verification required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cu-email" className="text-xs">Email *</Label>
                <Input id="cu-email" type="email" value={createForm.email} onChange={(e) => updateField("email", e.target.value)} placeholder="user@example.com" />
              </div>
              <div>
                <Label htmlFor="cu-password" className="text-xs">Password *</Label>
                <Input id="cu-password" type="password" value={createForm.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Min 6 characters" />
              </div>
            </div>
            <div>
              <Label htmlFor="cu-display" className="text-xs">Display Name</Label>
              <Input id="cu-display" value={createForm.display_name} onChange={(e) => updateField("display_name", e.target.value)} placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cu-first" className="text-xs">First Name</Label>
                <Input id="cu-first" value={createForm.first_name} onChange={(e) => updateField("first_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cu-last" className="text-xs">Last Name</Label>
                <Input id="cu-last" value={createForm.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cu-city" className="text-xs">City</Label>
                <Input id="cu-city" value={createForm.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cu-country" className="text-xs">Country</Label>
                <Input id="cu-country" value={createForm.country} onChange={(e) => updateField("country", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cu-phone" className="text-xs">Phone Number</Label>
              <Input id="cu-phone" type="tel" value={createForm.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={createForm.role} onValueChange={(v) => updateField("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
