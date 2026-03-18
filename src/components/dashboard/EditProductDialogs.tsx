import { useState } from "react";
import { Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useUpdateBand, useUpdateBandSection, useUpdateCostumeProduct,
  useUpdateSectionVersion, useUpdateJouvertPackage,
} from "@/hooks/use-products";
import { useCarnivals } from "@/hooks/use-carnivals";
import { toast } from "sonner";
import { COSTUME_SIZES } from "@/types";
import type { Band, BandSection, CostumeProduct, SectionVersion, JouvertPackage } from "@/types";
import { Rocket } from "lucide-react";

/* ═══════════════════════════════════════
   EDIT BAND DIALOG
   ═══════════════════════════════════════ */

export function EditBandDialog({ band }: { band: Band }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(band.name);
  const [description, setDescription] = useState(band.description || "");
  const [carnivalId, setCarnivalId] = useState((band as any).carnival_id || "");
  const [carnivalYear, setCarnivalYear] = useState((band as any).carnival_year ? String((band as any).carnival_year) : "");
  const updateMutation = useUpdateBand();
  const { data: carnivals } = useCarnivals();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setName(band.name);
      setDescription(band.description || "");
      setCarnivalId((band as any).carnival_id || "");
      setCarnivalYear((band as any).carnival_year ? String((band as any).carnival_year) : "");
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Band name is required"); return; }
    try {
      await updateMutation.mutateAsync({
        id: band.id,
        name: name.trim(),
        description: description.trim() || null,
        carnival_id: carnivalId || null,
        carnival_year: carnivalYear ? parseInt(carnivalYear) : null,
      });
      toast.success("Band updated!");
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  const selectedCarnival = carnivals?.find((c) => c.id === carnivalId);
  const availableYears = selectedCarnival?.carnival_seasons?.map((s) => s.year) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Band</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Band Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
            <Label className="text-primary font-semibold text-xs">Carnival Association</Label>
            <Select
              value={carnivalId || "none"}
              onValueChange={(v) => {
                setCarnivalId(v === "none" ? "" : v);
                setCarnivalYear("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select a carnival" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No carnival</SelectItem>
                {carnivals?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.city}, {c.country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carnivalId && availableYears.length > 0 && (
              <div className="space-y-1.5 mt-1">
                <Label className="text-xs">Season Year</Label>
                <Select value={carnivalYear} onValueChange={setCarnivalYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════
   EDIT SECTION DIALOG
   ═══════════════════════════════════════ */

export function EditSectionDialog({ section }: { section: BandSection }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description || "");
  const [sectionGender, setSectionGender] = useState(section.section_gender || "unisex");
  const [inventoryLimit, setInventoryLimit] = useState(section.inventory_limit?.toString() || "");
  const [launchOption, setLaunchOption] = useState<"immediate" | "schedule">(section.launch_at ? "schedule" : "immediate");
  const [launchAt, setLaunchAt] = useState(section.launch_at ? new Date(section.launch_at).toISOString().slice(0, 16) : "");
  const updateMutation = useUpdateBandSection();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setName(section.name);
      setDescription(section.description || "");
      setSectionGender(section.section_gender || "unisex");
      setInventoryLimit(section.inventory_limit?.toString() || "");
      setLaunchOption(section.launch_at ? "schedule" : "immediate");
      setLaunchAt(section.launch_at ? new Date(section.launch_at).toISOString().slice(0, 16) : "");
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Section name is required"); return; }
    try {
      await updateMutation.mutateAsync({
        id: section.id,
        name: name.trim(),
        description: description.trim() || null,
        section_gender: sectionGender,
        inventory_limit: inventoryLimit ? parseInt(inventoryLimit) : null,
        launch_at: launchOption === "schedule" && launchAt ? new Date(launchAt).toISOString() : null,
      });
      toast.success("Section updated!");
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Section</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
            <Label className="text-foreground font-semibold">Section Gender</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["women", "men", "unisex"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSectionGender(opt)}
                  className={`px-3 py-2 rounded-xl border text-center text-xs font-medium transition-all ${
                    sectionGender === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Section Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Inventory Limit</Label>
            <Input type="number" value={inventoryLimit} onChange={(e) => setInventoryLimit(e.target.value)} placeholder="No limit" />
          </div>
          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
            <Label className="text-foreground font-semibold flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Launch Options
            </Label>
            <RadioGroup value={launchOption} onValueChange={(v) => setLaunchOption(v as "immediate" | "schedule")} className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="edit-launch-immediate" />
                <Label htmlFor="edit-launch-immediate" className="font-normal cursor-pointer text-xs">Launch Immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="edit-launch-schedule" />
                <Label htmlFor="edit-launch-schedule" className="font-normal cursor-pointer text-xs">Schedule Launch</Label>
              </div>
            </RadioGroup>
            {launchOption === "schedule" && (
              <div className="space-y-1.5 mt-1 pl-6">
                <Label className="text-xs">Launch Date & Time</Label>
                <Input type="datetime-local" value={launchAt} onChange={(e) => setLaunchAt(e.target.value)} />
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════
   EDIT VERSION DIALOG
   ═══════════════════════════════════════ */

export function EditVersionDialog({ version }: { version: SectionVersion }) {
  const [open, setOpen] = useState(false);
  const [versionName, setVersionName] = useState(version.version_name);
  const [price, setPrice] = useState(version.price.toString());
  const [inventory, setInventory] = useState(version.inventory_quantity.toString());
  const [description, setDescription] = useState(version.description || "");
  const updateMutation = useUpdateSectionVersion();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setVersionName(version.version_name);
      setPrice(version.price.toString());
      setInventory(version.inventory_quantity.toString());
      setDescription(version.description || "");
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    if (!versionName.trim()) { toast.error("Version name is required"); return; }
    if (!price) { toast.error("Price is required"); return; }
    try {
      await updateMutation.mutateAsync({
        id: version.id,
        version_name: versionName.trim(),
        price: parseFloat(price),
        inventory_quantity: parseInt(inventory) || 100,
        description: description.trim() || null,
      });
      toast.success("Version updated!");
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Edit Version</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Version Name</Label>
            <Input value={versionName} onChange={(e) => setVersionName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Price ($)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Inventory</Label>
            <Input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════
   EDIT COSTUME DIALOG
   ═══════════════════════════════════════ */

export function EditCostumeDialog({ costume }: { costume: CostumeProduct }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(costume.title);
  const [description, setDescription] = useState(costume.description || "");
  const [price, setPrice] = useState(costume.price.toString());
  const [gender, setGender] = useState(costume.gender || "");
  const [inventory, setInventory] = useState(costume.inventory_quantity.toString());
  const [sizes, setSizes] = useState<string[]>(costume.size_options || []);
  const [depositAmount, setDepositAmount] = useState(costume.deposit_amount?.toString() || "");
  const [balanceDueDate, setBalanceDueDate] = useState(costume.balance_due_date || "");
  const updateMutation = useUpdateCostumeProduct();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(costume.title);
      setDescription(costume.description || "");
      setPrice(costume.price.toString());
      setGender(costume.gender || "");
      setInventory(costume.inventory_quantity.toString());
      setSizes(costume.size_options || []);
      setDepositAmount(costume.deposit_amount?.toString() || "");
      setBalanceDueDate(costume.balance_due_date || "");
    }
    setOpen(isOpen);
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!title.trim() || !price) { toast.error("Title and price required"); return; }
    try {
      await updateMutation.mutateAsync({
        id: costume.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        gender: gender || null,
        inventory_quantity: parseInt(inventory) || 100,
        size_options: sizes,
        deposit_amount: depositAmount ? parseFloat(depositAmount) : null,
        balance_due_date: balanceDueDate || null,
      });
      toast.success("Costume updated!");
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Costume</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Inventory</Label>
            <Input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Deposit ($)</Label>
              <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Balance Due</Label>
              <Input type="date" value={balanceDueDate} onChange={(e) => setBalanceDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-1.5">
              {COSTUME_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    sizes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════
   EDIT JOUVERT PACKAGE DIALOG
   ═══════════════════════════════════════ */

export function EditJouvertDialog({ pkg }: { pkg: JouvertPackage }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(pkg.name);
  const [price, setPrice] = useState(pkg.price.toString());
  const [quantity, setQuantity] = useState(pkg.quantity);
  const [bundleItemsText, setBundleItemsText] = useState((pkg.bundle_items || []).join(", "));
  const [carnivalId, setCarnivalId] = useState((pkg as any).carnival_id || "");
  const [carnivalYear, setCarnivalYear] = useState((pkg as any).carnival_year ? String((pkg as any).carnival_year) : "");
  const updateMutation = useUpdateJouvertPackage();
  const { data: carnivals } = useCarnivals();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setName(pkg.name);
      setPrice(pkg.price.toString());
      setQuantity(pkg.quantity);
      setBundleItemsText((pkg.bundle_items || []).join(", "));
      setCarnivalId((pkg as any).carnival_id || "");
      setCarnivalYear((pkg as any).carnival_year ? String((pkg as any).carnival_year) : "");
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    if (!name.trim() || !price) { toast.error("Name and price required"); return; }
    const bundleItems = bundleItemsText.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await updateMutation.mutateAsync({
        id: pkg.id,
        name: name.trim(),
        price: parseFloat(price),
        quantity,
        bundle_items: bundleItems,
        carnival_id: carnivalId || null,
        carnival_year: carnivalYear ? parseInt(carnivalYear) : null,
      });
      toast.success("Package updated!");
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  const selectedCarnival = carnivals?.find((c) => c.id === carnivalId);
  const availableYears = selectedCarnival?.carnival_seasons?.map((s) => s.year) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit J'ouvert Package</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Price ($)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Bundle Items (comma-separated)</Label>
            <Textarea value={bundleItemsText} onChange={(e) => setBundleItemsText(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
            <Label className="text-primary font-semibold text-xs">Carnival Association</Label>
            <Select
              value={carnivalId || "none"}
              onValueChange={(v) => {
                setCarnivalId(v === "none" ? "" : v);
                setCarnivalYear("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select a carnival" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No carnival</SelectItem>
                {carnivals?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.city}, {c.country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carnivalId && availableYears.length > 0 && (
              <div className="space-y-1.5 mt-1">
                <Label className="text-xs">Season Year</Label>
                <Select value={carnivalYear} onValueChange={setCarnivalYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
