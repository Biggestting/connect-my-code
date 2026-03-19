import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import tifeteLogo from "@/assets/tifete-logo.png";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center">
        <img src={tifeteLogo} alt="Ti'Fete" className="h-9 w-auto" />
      </Link>
      <Link to="/search" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
        <Search className="h-4 w-4" />
      </Link>
    </header>
  );
}
