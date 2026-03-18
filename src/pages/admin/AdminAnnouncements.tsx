import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("platform_announcements").insert({
        title: form.title,
        message: form.message,
        type: form.type,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Announcement published");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
      setDialogOpen(false);
      setForm({ title: "", message: "", type: "info" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("platform_announcements").update({ active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("platform_announcements").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    toast.success("Announcement deleted");
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    alert: "bg-red-100 text-red-700",
    maintenance: "bg-purple-100 text-purple-700",
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Platform Announcements</h1>
            <p className="text-sm text-muted-foreground">{announcements?.filter((a: any) => a.active).length || 0} active</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full gap-1"><Plus className="w-4 h-4" /> New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Announcement title" /></div>
                <div><Label>Message *</Label><Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Announcement details..." rows={3} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={!form.title || !form.message} className="w-full rounded-full">Publish</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {announcements?.map((a: any) => (
              <div key={a.id} className={`p-4 rounded-xl border ${a.active ? "border-border" : "border-border/50 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-foreground">{a.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColors[a.type] || typeColors.info}`}>{a.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.created_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={a.active} onCheckedChange={(v) => toggleActive(a.id, v)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteAnnouncement(a.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!announcements || announcements.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No announcements yet.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
