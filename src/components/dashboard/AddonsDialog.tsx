import { useState } from "react";
import { Plus, Trash2, DollarSign, ShoppingCart, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  useProductAddons,
  useCreateProductAddon,
  useDeleteProductAddon,
  useUpdateProductAddon,
  useCreateAddonSizeOption,
  useDeleteAddonSizeOption,
} from "@/hooks/use-products";
import { toast } from "sonner";
import type { ProductAddon } from "@/types";

interface Props {
  jouvertPackageId?: string;
  costumeProductId?: string;
  productTitle: string;
}

export function AddonsDialog({ jouvertPackageId, costumeProductId, productTitle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Manage add-ons">
          <ShoppingCart className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">À la Carte Add-ons</DialogTitle>
          <DialogDescription className="text-xs">
            Optional priced extras buyers can add to <span className="font-medium text-foreground">{productTitle}</span>
          </DialogDescription>
        </DialogHeader>
        {open && <AddonsManager jouvertPackageId={jouvertPackageId} costumeProductId={costumeProductId} />}
      </DialogContent>
    </Dialog>
  );
}

function AddonsManager({ jouvertPackageId, costumeProductId }: { jouvertPackageId?: string; costumeProductId?: string }) {
  const { data: addons, isLoading } = useProductAddons(jouvertPackageId, costumeProductId);
  const createMutation = useCreateProductAddon();
  const deleteMutation = useDeleteProductAddon();
  const updateMutation = useUpdateProductAddon();
  const createSizeMutation = useCreateAddonSizeOption();
  const deleteSizeMutation = useDeleteAddonSizeOption();

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaxQty, setNewMaxQty] = useState("100");
  const [newHasSizes, setNewHasSizes] = useState(false);
  const [newSizeOptions, setNewSizeOptions] = useState<{ label: string; value: string; inventory_quantity: string }[]>([]);

  const handleAddSizeRow = () => {
    setNewSizeOptions([...newSizeOptions, { label: "", value: "", inventory_quantity: "" }]);
  };

  const handleRemoveSizeRow = (index: number) => {
    setNewSizeOptions(newSizeOptions.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, field: string, val: string) => {
    const updated = [...newSizeOptions];
    (updated[index] as any)[field] = val;
    setNewSizeOptions(updated);
  };

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("Add-on name is required"); return; }
    if (!newPrice || parseFloat(newPrice) <= 0) { toast.error("Price must be greater than 0"); return; }
    if (newHasSizes && newSizeOptions.length === 0) { toast.error("Add at least one size option"); return; }
    if (newHasSizes && newSizeOptions.some(s => !s.label.trim() || !s.value.trim())) {
      toast.error("All size options need a label and value"); return;
    }

    try {
      const addon = await createMutation.mutateAsync({
        ...(jouvertPackageId ? { jouvert_package_id: jouvertPackageId } : {}),
        ...(costumeProductId ? { costume_product_id: costumeProductId } : {}),
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        price: parseFloat(newPrice),
        max_quantity: parseInt(newMaxQty) || 100,
        sort_order: (addons?.length || 0) + 1,
        has_size_options: newHasSizes,
      });

      // Create size options if enabled
      if (newHasSizes && newSizeOptions.length > 0) {
        for (let i = 0; i < newSizeOptions.length; i++) {
          const s = newSizeOptions[i];
          await createSizeMutation.mutateAsync({
            addon_id: addon.id,
            label: s.label.trim(),
            value: s.value.trim(),
            sort_order: i,
            inventory_quantity: s.inventory_quantity ? parseInt(s.inventory_quantity) : null,
          });
        }
      }

      toast.success("Add-on created");
      setNewName(""); setNewPrice(""); setNewDescription(""); setNewMaxQty("100");
      setNewHasSizes(false); setNewSizeOptions([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create add-on");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Add-on removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete add-on");
    }
  };

  const handleToggleSizes = async (addon: ProductAddon, enabled: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: addon.id, has_size_options: enabled });
      if (!enabled) {
        // Delete existing size options when disabling
        const sizes = addon.addon_size_options || [];
        for (const s of sizes) {
          await deleteSizeMutation.mutateAsync(s.id);
        }
      }
      toast.success(enabled ? "Size options enabled" : "Size options disabled");
    } catch (err: any) {
      toast.error(err.message || "Failed to update add-on");
    }
  };

  const handleAddSizeToExisting = async (addonId: string, existingCount: number) => {
    try {
      await createSizeMutation.mutateAsync({
        addon_id: addonId,
        label: "",
        value: "",
        sort_order: existingCount,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to add size option");
    }
  };

  const handleDeleteSize = async (sizeId: string) => {
    try {
      await deleteSizeMutation.mutateAsync(sizeId);
      toast.success("Size option removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete size option");
    }
  };

  if (isLoading) {
    return <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading add-ons...</div>;
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Existing Add-ons */}
      {addons && addons.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Add-ons ({addons.length})</p>
          {addons.map((addon) => (
            <div key={addon.id} className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-start gap-2">
                <DollarSign className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground">{addon.name}</p>
                    <Badge variant="secondary" className="text-[9px]">${Number(addon.price).toFixed(2)}</Badge>
                    {addon.has_size_options && (
                      <Badge variant="outline" className="text-[9px] gap-0.5">
                        <Ruler className="w-2.5 h-2.5" /> Sizes
                      </Badge>
                    )}
                  </div>
                  {addon.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{addon.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {addon.sold_count}/{addon.max_quantity} sold
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleDelete(addon.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>

              {/* Size toggle for existing addon */}
              <div className="flex items-center justify-between pl-5">
                <Label className="text-[10px] text-muted-foreground">Enable Size Options</Label>
                <Switch
                  checked={addon.has_size_options}
                  onCheckedChange={(checked) => handleToggleSizes(addon, checked)}
                  className="scale-75"
                />
              </div>

              {/* Existing size options */}
              {addon.has_size_options && (
                <div className="pl-5 space-y-1.5">
                  {(addon.addon_size_options || [])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((size) => (
                    <div key={size.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-medium text-foreground">{size.label || "—"}</span>
                      <span className="text-muted-foreground">({size.value || "—"})</span>
                      {size.inventory_quantity != null && (
                        <span className="text-muted-foreground">· Inv: {size.inventory_quantity}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-auto"
                        onClick={() => handleDeleteSize(size.id)}
                      >
                        <Trash2 className="w-2.5 h-2.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-5 px-1.5 text-primary"
                    onClick={() => handleAddSizeToExisting(addon.id, addon.addon_size_options?.length || 0)}
                  >
                    <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Size
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-border rounded-lg">
          <p className="text-xs text-muted-foreground">No add-ons yet. Add one below.</p>
        </div>
      )}

      {/* Add New Add-on */}
      <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> Add à la Carte Item
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Extra T-shirt, Cooler Upgrade"
            className="h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Price ($)</Label>
            <Input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs"
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Qty</Label>
            <Input
              type="number"
              value={newMaxQty}
              onChange={(e) => setNewMaxQty(e.target.value)}
              className="h-8 text-xs"
              min="1"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Description (optional)</Label>
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Brief description of this add-on"
            className="h-8 text-xs"
          />
        </div>

        {/* Size Options Toggle */}
        <div className="flex items-center justify-between py-1">
          <Label className="text-xs flex items-center gap-1.5">
            <Ruler className="w-3 h-3" /> Enable Size Options
          </Label>
          <Switch
            checked={newHasSizes}
            onCheckedChange={(checked) => {
              setNewHasSizes(checked);
              if (checked && newSizeOptions.length === 0) {
                setNewSizeOptions([{ label: "Small", value: "S", inventory_quantity: "" }]);
              }
              if (!checked) setNewSizeOptions([]);
            }}
          />
        </div>

        {/* Size Options List */}
        {newHasSizes && (
          <div className="space-y-2 pl-2 border-l-2 border-primary/20">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Size Options</p>
            {newSizeOptions.map((size, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={size.label}
                  onChange={(e) => handleSizeChange(i, "label", e.target.value)}
                  placeholder="Label (Small)"
                  className="h-7 text-[11px] flex-1"
                />
                <Input
                  value={size.value}
                  onChange={(e) => handleSizeChange(i, "value", e.target.value)}
                  placeholder="Value (S)"
                  className="h-7 text-[11px] w-16"
                />
                <Input
                  type="number"
                  value={size.inventory_quantity}
                  onChange={(e) => handleSizeChange(i, "inventory_quantity", e.target.value)}
                  placeholder="Inv"
                  className="h-7 text-[11px] w-14"
                  min="0"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveSizeRow(i)}>
                  <Trash2 className="w-2.5 h-2.5 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-primary" onClick={handleAddSizeRow}>
              <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Size Option
            </Button>
          </div>
        )}

        <Button
          onClick={handleAdd}
          disabled={createMutation.isPending || !newName.trim() || !newPrice}
          size="sm"
          className="w-full rounded-full text-xs"
        >
          {createMutation.isPending ? "Adding..." : "Add Item"}
        </Button>
      </div>
    </div>
  );
}
