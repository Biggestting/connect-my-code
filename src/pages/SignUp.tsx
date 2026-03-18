import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignUpPage() {
  const { user, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;

      // Update the auto-created profile with first_name, last_name, phone_number
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
          })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      setEmailSent(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("Verification email resent!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-3xl font-extrabold">
            <span className="gradient-primary bg-clip-text text-transparent">Ti'Fete</span>
          </h1>
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent a confirmation email to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Please click the verification link in the email to complete your account registration.
          </p>
          <p className="text-xs text-muted-foreground">
            If you don't see the email, check your spam folder.
          </p>
          <Button variant="outline" className="rounded-full" onClick={handleResend} disabled={resending}>
            {resending ? "Resending..." : "Resend Email"}
          </Button>
          <Link to="/auth" className="block text-sm text-accent hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">
            <span className="gradient-primary bg-clip-text text-transparent">Ti'Fete</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 000-0000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="text-accent font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
