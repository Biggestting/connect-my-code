import { format } from "date-fns";
import { FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DraftEvent {
  id: string;
  title: string;
  updated_at: string;
  venue: string | null;
  city: string | null;
}

interface DraftRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: DraftEvent[];
  onResume: (id: string) => void;
  onDiscard: (id: string) => void;
  onStartFresh: () => void;
}

export function DraftRecoveryDialog({
  open, onOpenChange, drafts, onResume, onDiscard, onStartFresh,
}: DraftRecoveryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Draft Found
          </DialogTitle>
          <DialogDescription>
            You have unsaved event draft{drafts.length > 1 ? "s" : ""}. Continue editing?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1 max-h-[40vh] overflow-y-auto">
          {drafts.map((draft) => (
            <div key={draft.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {draft.title || "Untitled Event"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {draft.venue && `${draft.venue} · `}
                  {draft.city && `${draft.city} · `}
                  Last edited {format(new Date(draft.updated_at), "MMM d, h:mm a")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="default" className="h-7 text-xs rounded-full" onClick={() => onResume(draft.id)}>
                  Continue
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDiscard(draft.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full rounded-full" onClick={onStartFresh}>
          Start Fresh
        </Button>
      </DialogContent>
    </Dialog>
  );
}
