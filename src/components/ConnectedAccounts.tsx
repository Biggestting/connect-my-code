import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link2, Unlink, Mail, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Provider {
  id: string;
  label: string;
  icon: React.ReactNode;
  oauthProvider?: "google" | "apple";
}

const PROVIDERS: Provider[] = [
  {
    id: "google",
    label: "Google",
    oauthProvider: "google",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    oauthProvider: "apple",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email & Password",
    icon: <Mail className="w-5 h-5" />,
  },
];

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [linking, setLinking] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [reAuthLoading, setReAuthLoading] = useState(false);

  if (!user) return null;

  const identities = user.identities || [];

  const isProviderLinked = (providerId: string) => {
    return identities.some((identity) => identity.provider === providerId);
  };

  const linkedCount = PROVIDERS.filter((p) =>
    isProviderLinked(p.id)
  ).length;

  const handleLink = async (provider: Provider) => {
    // Require re-authentication before linking — prompt for password
    setPendingProvider(provider);
    setReAuthPassword("");
    setReAuthOpen(true);
  };

  const handleReAuthAndLink = async () => {
    if (!user?.email || !pendingProvider) return;

    setReAuthLoading(true);
    try {
      // Re-authenticate with current password
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: reAuthPassword,
      });

      if (reAuthError) {
        toast.error("Re-authentication failed. Please check your password.");
        setReAuthLoading(false);
        return;
      }

      setReAuthOpen(false);
      await performLink(pendingProvider);
    } catch (err: any) {
      toast.error(err.message || "Re-authentication failed");
    } finally {
      setReAuthLoading(false);
    }
  };

  const performLink = async (provider: Provider) => {
    setLinking(provider.id);
    try {
      if (provider.oauthProvider) {
        const { error } = await supabase.auth.linkIdentity({
          provider: provider.oauthProvider,
          options: {
            redirectTo: `${window.location.origin}/profile`,
          },
        });
        if (error) throw error;
        // OAuth redirect will handle the rest
      } else {
        toast.info("Email & password is already your primary identity.");
      }
    } catch (err: any) {
      if (err.message?.includes("already linked")) {
        toast.error("This provider account is already linked to another user. Please sign in with that account and link from there.");
      } else {
        toast.error(err.message || "Failed to link account");
      }
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (providerId: string) => {
    if (linkedCount <= 1) {
      toast.error("You must keep at least one sign-in method connected.");
      return;
    }

    setLinking(providerId);
    try {
      const identity = identities.find((i) => i.provider === providerId);
      if (!identity) throw new Error("Identity not found");

      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      toast.success(`${PROVIDERS.find((p) => p.id === providerId)?.label} disconnected`);
      // Refresh session to get updated identities
      await supabase.auth.refreshSession();
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink account");
    } finally {
      setLinking(null);
      setConfirmUnlink(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Connected Accounts</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Link multiple sign-in methods to your account. Your tickets, orders, and data always stay tied to your account.
        </p>

        <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
          {PROVIDERS.map((provider) => {
            const linked = isProviderLinked(provider.id);
            const identity = identities.find((i) => i.provider === provider.id);
            const identityEmail = identity?.identity_data?.email as string | undefined;

            return (
              <div
                key={provider.id}
                className="flex items-center gap-3 p-4"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {provider.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{provider.label}</p>
                  {linked && identityEmail && (
                    <p className="text-xs text-muted-foreground truncate">{identityEmail}</p>
                  )}
                </div>
                {linked ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-0">
                      Connected
                    </Badge>
                    {linkedCount > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmUnlink(provider.id)}
                        disabled={linking === provider.id}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={() => handleLink(provider)}
                    disabled={linking === provider.id}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {linking === provider.id ? "Linking..." : "Connect"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Re-authentication dialog */}
      <AlertDialog open={reAuthOpen} onOpenChange={setReAuthOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your identity</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your password to link a new sign-in method to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              value={reAuthPassword}
              onChange={(e) => setReAuthPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => {
                if (e.key === "Enter" && reAuthPassword) handleReAuthAndLink();
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReAuthAndLink}
              disabled={!reAuthPassword || reAuthLoading}
            >
              {reAuthLoading ? "Verifying..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={!!confirmUnlink} onOpenChange={() => setConfirmUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in with{" "}
              {PROVIDERS.find((p) => p.id === confirmUnlink)?.label}. Your tickets and orders are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnlink && handleUnlink(confirmUnlink)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
