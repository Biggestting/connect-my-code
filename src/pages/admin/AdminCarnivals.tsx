import { useState, useRef, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Search, Globe, Upload, Type, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GRADIENTS = [
  { label: "Sunset", value: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" },
  { label: "Ocean", value: "linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)" },
  { label: "Forest", value: "linear-gradient(135deg, #10b981, #059669, #047857)" },
  { label: "Fire", value: "linear-gradient(135deg, #ef4444, #f97316, #eab308)" },
  { label: "Midnight", value: "linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)" },
  { label: "Gold", value: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)" },
  { label: "Carnival", value: "linear-gradient(135deg, #f43f5e, #a855f7, #06b6d4)" },
  { label: "Tropical", value: "linear-gradient(135deg, #84cc16, #22d3ee, #f472b6)" },
];

const FONTS = [
  { label: "Bold Sans", value: "'Inter', sans-serif", weight: "900" },
  { label: "Serif", value: "'Georgia', serif", weight: "700" },
  { label: "Mono", value: "'Courier New', monospace", weight: "700" },
];

function TextHeroPreview({ text, gradient, font, subtitle }: { text: string; gradient: string; font: typeof FONTS[0]; subtitle: string }) {
  return (
    <div
      className="w-full aspect-[16/9] rounded-lg flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-center px-6">
        <h2
          className="text-white drop-shadow-lg leading-tight"
          style={{
            fontFamily: font.value,
            fontWeight: font.weight,
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {text || "Carnival Name"}
        </h2>
        {subtitle && (
          <p className="text-white/80 text-sm mt-1 drop-shadow" style={{ fontFamily: font.value }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

export default function AdminCarnivals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", city: "", country: "", description: "", image_url: "" });
  const [imageTab, setImageTab] = useState<string>("upload");
  const [uploading, setUploading] = useState(false);
  const [heroGradient, setHeroGradient] = useState(GRADIENTS[0].value);
  const [heroFont, setHeroFont] = useState(FONTS[0]);
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [generatingHero, setGeneratingHero] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: carnivals, isLoading } = useQuery({
    queryKey: ["admin-carnivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carnivals")
        .select("*, carnival_seasons(*)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = carnivals?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", city: "", country: "", description: "", image_url: "" });
    setHeroSubtitle("");
    setHeroGradient(GRADIENTS[0].value);
    setHeroFont(FONTS[0]);
    setImageTab("upload");
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      city: c.city || "",
      country: c.country || "",
      description: c.description || "",
      image_url: c.image_url || "",
    });
    setHeroSubtitle([c.city, c.country].filter(Boolean).join(", "));
    setImageTab("upload");
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("carnival-images")
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("carnival-images").getPublicUrl(fileName);
      setForm((p) => ({ ...p, image_url: publicUrl }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const generateTextHero = useCallback(async () => {
    setGeneratingHero(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext("2d")!;

      // Draw gradient
      const gradientMatch = heroGradient.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
      if (gradientMatch) {
        const angle = parseInt(gradientMatch[1]) * (Math.PI / 180);
        const colors = gradientMatch[2].split(",").map((c) => c.trim());
        const x0 = canvas.width / 2 - Math.cos(angle) * canvas.width / 2;
        const y0 = canvas.height / 2 - Math.sin(angle) * canvas.height / 2;
        const x1 = canvas.width / 2 + Math.cos(angle) * canvas.width / 2;
        const y1 = canvas.height / 2 + Math.sin(angle) * canvas.height / 2;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = "#1e1b4b";
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dark overlay
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      const title = form.name || "Carnival";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      ctx.font = `${heroFont.weight} 72px ${heroFont.value}`;
      ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 - (heroSubtitle ? 20 : 0), canvas.width - 100);

      // Subtitle
      if (heroSubtitle) {
        ctx.font = `400 28px ${heroFont.value}`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(heroSubtitle, canvas.width / 2, canvas.height / 2 + 45, canvas.width - 100);
      }

      // Bottom vignette
      const vigGrad = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.shadowBlur = 0;
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      const fileName = `hero-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("carnival-images")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("carnival-images").getPublicUrl(fileName);
      setForm((p) => ({ ...p, image_url: publicUrl }));
      toast.success("Hero image generated & uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingHero(false);
    }
  }, [form.name, heroGradient, heroFont, heroSubtitle]);

  const handleSave = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      if (editing) {
        const { error } = await supabase.from("carnivals").update({
          name: form.name, slug, city: form.city || null, country: form.country || null,
          description: form.description || null, image_url: form.image_url || null,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Carnival updated");
      } else {
        const { error } = await supabase.from("carnivals").insert({
          name: form.name, slug, city: form.city || null, country: form.country || null,
          description: form.description || null, image_url: form.image_url || null,
        });
        if (error) throw error;
        toast.success("Carnival created");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-carnivals"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Carnival Management</h1>
            <p className="text-sm text-muted-foreground">{carnivals?.length || 0} carnivals</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} size="sm" className="rounded-full gap-1">
                <Plus className="w-4 h-4" /> Add Carnival
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Carnival" : "Create Carnival"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
                  <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} /></div>
                </div>

                {/* Hero Image Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Hero Image</Label>
                  
                  {form.image_url && (
                    <div className="relative">
                      <img src={form.image_url} alt="Preview" className="w-full aspect-[16/9] rounded-lg object-cover border border-border" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-7 text-xs rounded-full"
                        onClick={() => setForm((p) => ({ ...p, image_url: "" }))}
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  <Tabs value={imageTab} onValueChange={setImageTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="upload" className="flex-1 gap-1.5 text-xs">
                        <Upload className="w-3 h-3" /> Upload Photo
                      </TabsTrigger>
                      <TabsTrigger value="design" className="flex-1 gap-1.5 text-xs">
                        <Type className="w-3 h-3" /> Design Hero
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-2 mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-20 border-dashed rounded-lg flex flex-col gap-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Uploading…</span></>
                        ) : (
                          <><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Click to upload (max 5MB)</span></>
                        )}
                      </Button>
                      <div>
                        <Label className="text-xs text-muted-foreground">Or paste image URL</Label>
                        <Input
                          value={form.image_url}
                          onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                          placeholder="https://..."
                          className="text-xs"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="design" className="space-y-3 mt-2">
                      <TextHeroPreview text={form.name} gradient={heroGradient} font={heroFont} subtitle={heroSubtitle} />

                      <div>
                        <Label className="text-xs">Subtitle</Label>
                        <Input
                          value={heroSubtitle}
                          onChange={(e) => setHeroSubtitle(e.target.value)}
                          placeholder="e.g. Port of Spain, Trinidad"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Gradient</Label>
                        <div className="grid grid-cols-4 gap-1.5 mt-1">
                          {GRADIENTS.map((g) => (
                            <button
                              key={g.label}
                              type="button"
                              className={`h-8 rounded-md border-2 transition-all ${heroGradient === g.value ? "border-primary scale-105" : "border-transparent"}`}
                              style={{ background: g.value }}
                              onClick={() => setHeroGradient(g.value)}
                              title={g.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Font Style</Label>
                        <Select
                          value={heroFont.label}
                          onValueChange={(v) => setHeroFont(FONTS.find((f) => f.label === v) || FONTS[0])}
                        >
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map((f) => (
                              <SelectItem key={f.label} value={f.label}>
                                <span style={{ fontFamily: f.value }}>{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        onClick={generateTextHero}
                        disabled={generatingHero || !form.name}
                        className="w-full rounded-full gap-1.5"
                      >
                        {generatingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
                        Generate & Use Hero Image
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>

                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
                <Button onClick={handleSave} className="w-full rounded-full">{editing ? "Save Changes" : "Create Carnival"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search carnivals..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered?.map((c, i) => {
              const gradient = GRADIENTS[i % GRADIENTS.length].value;
              return (
                <div
                  key={c.id}
                  className="group relative rounded-xl overflow-hidden cursor-pointer border border-border hover:ring-2 hover:ring-primary/40 transition-all"
                  onClick={() => openEdit(c)}
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full aspect-[16/9] object-cover" />
                  ) : (
                    <div
                      className="w-full aspect-[16/9] flex flex-col items-center justify-center relative"
                      style={{ background: gradient }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 text-center px-4">
                        <h3
                          className="text-white font-black leading-tight drop-shadow-lg"
                          style={{
                            fontSize: "clamp(0.85rem, 2.5vw, 1.25rem)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {c.name}
                        </h3>
                        {(c.city || c.country) && (
                          <p className="text-white/75 text-[11px] mt-0.5 drop-shadow">
                            {[c.city, c.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0 backdrop-blur-sm">
                      {c.carnival_seasons?.length || 0} seasons
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No carnivals found.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
