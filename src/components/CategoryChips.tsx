import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/types";

interface CategoryChipsProps {
  selected: string;
  onChange: (value: string) => void;
}

export function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === cat.value
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-border"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
