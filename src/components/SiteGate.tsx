import { useState } from "react";
import tifeteLogo from "@/assets/tifete-logo.png";

const SITE_PASSWORD = "1121";
const STORAGE_KEY = "tifete_site_access";

export function SiteGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "true");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (granted) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setGranted(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-6 text-center">
        <img src={tifeteLogo} alt="Ti'Fete" className="h-16 w-auto mx-auto" />
        <div>
          <p className="text-sm text-muted-foreground">This site is currently in development.</p>
          <p className="text-sm text-muted-foreground">Enter the access code to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Access code"
            className="w-full h-11 rounded-full border border-border bg-background px-4 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">Incorrect code. Try again.</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-full gradient-primary text-primary-foreground font-semibold text-sm"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
