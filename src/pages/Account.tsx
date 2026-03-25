import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveProfile } from "@/hooks/use-active-profile";
import { useIsAdmin } from "@/hooks/use-admin";
import {
  User, LogOut, Ticket, Heart, ChevronRight, Megaphone, Pencil, Trash2, Mail,
  Building2, ArrowRightLeft, Shield, Settings, CreditCard, ShoppingBag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const {
    activeProfile, switchToUser, switchToOrganizer,
    isOrganizerMode, userOrganizers
  } = useActiveProfile();
  const { data: isAdmin } = useIsAdmin();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <User className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">Sign in to QUARA</p>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your account, tickets, and saved items.
        </p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const menuItems = [
    { icon: ShoppingBag, label: "Purchases", path: "/tickets", description: "Tickets, costumes & orders" },
    { icon: Heart, label: "Saved", path: "/saved", description: "Your watchlist" },
    ...(isAdmin ? [{ icon: Shield, label: "Admin Panel", path: "/admin", description: "Platform management" }] : []),
  ];

  return (
    <div className="pb-20 md:pb-8 max-w-4xl mx-auto w-full">
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-6">Account</h1>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">
              {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {profile?.display_name || user.email?.split("@")[0]}
              </h2>
              <EditNameDialog
                currentName={profile?.display_name || ""}
                userId={user.id}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <ChangeEmailDialog currentEmail={user.email || ""} />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-1 mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Separator className="mb-6" />

        {/* Profile Switcher Section */}
        {userOrganizers && userOrganizers.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Your Profiles</p>
            </div>

            <button
              onClick={switchToUser}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                !isOrganizerMode ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
              }`}
            >
              <User className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Personal</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              {!isOrganizerMode && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>

            {userOrganizers.map((membership) => (
              <button
                key={membership.organizer_id}
                onClick={() =>
                  switchToOrganizer(
                    membership.organizer_id,
                    membership.organizers?.name || "",
                    membership.organizers?.slug || ""
                  )
                }
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  activeProfile.organizerId === membership.organizer_id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={membership.organizers?.logo_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {(membership.organizers?.name || "O").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">@{membership.organizers?.slug}</p>
                  <p className="text-xs text-muted-foreground">{membership.role}</p>
                </div>
                {activeProfile.organizerId === membership.organizer_id && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Organizer Tools */}
        {userOrganizers && userOrganizers.length > 0 ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors mb-2"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">Organizer Dashboard</span>
              <p className="text-xs text-muted-foreground">Manage your events</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            to="/request-organizer"
            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-primary/40 hover:bg-primary/5 transition-colors mb-6"
          >
            <Building2 className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground block">Request Organizer Profile</span>
              <span className="text-xs text-muted-foreground">Apply to start hosting events on QUARA</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}

        <Separator className="my-6" />

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link to="/accessibility" className="hover:text-foreground transition-colors">
            Accessibility
          </Link>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="w-full rounded-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground mb-3"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent. All your data including tickets, saved items, and profile will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ChangeEmailDialog({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = email.trim();
    if (!trimmed) { toast.error("Email cannot be empty"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast.error("Please enter a valid email address"); return; }
    if (trimmed === currentEmail) { toast.error("New email must be different from current email"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      toast.success("Confirmation email sent to both your old and new address. Please check your inbox.");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setEmail(""); }}>
      <DialogTrigger asChild>
        <button className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
          <Mail className="w-3 h-3 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentEmail}</span>
          </p>
          <div className="space-y-2">
            <Label>New Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new@example.com" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11">
            {saving ? "Sending..." : "Update Email"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">You'll need to confirm the change from both email addresses.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditNameDialog({ currentName, userId, onSuccess }: { currentName: string; userId: string; onSuccess: () => void; }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", userId);
      if (error) throw error;
      toast.success("Name updated!");
      onSuccess();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setName(currentName); }}>
      <DialogTrigger asChild>
        <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Display Name</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
