import { useActiveAnnouncements } from "@/hooks/use-platform";
import { AlertTriangle, Info, Megaphone, Wrench, X } from "lucide-react";
import { useState } from "react";

const typeConfig: Record<string, any> = {
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800" },
  alert: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
  maintenance: { icon: Wrench, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800" },
};

export function AnnouncementBanner() {
  const { data: announcements } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!announcements || announcements.length === 0) return null;

  const visible = announcements.filter((a: any) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map((a: any) => {
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 ${config.bg} ${config.border} border-b`}>
            <Icon className={`h-4 w-4 shrink-0 ${config.text}`} />
            <p className={`text-sm flex-1 ${config.text}`}>
              <strong>{a.title}</strong> {a.message}
            </p>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
              className={`${config.text} hover:opacity-70 shrink-0`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
