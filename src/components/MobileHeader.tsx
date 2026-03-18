import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import tifeteLogo from "@/assets/tifete-logo.png";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-lg font-extrabold">
          <span className="gradient-primary bg-clip-text text-transparent">Ti'Fete</span>
        </span>
      </Link>
      <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">
        <Search className="h-5 w-5" />
      </Link>
    </header>
  );
}
