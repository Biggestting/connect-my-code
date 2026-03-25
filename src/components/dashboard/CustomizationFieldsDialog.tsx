import { useState } from "react";
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  useCustomizationFields,
  useJouvertCustomizationFields,
  useVersionCustomizationFields,
  useCreateCustomizationField,
  useDeleteCustomizationField,
} from "@/hooks/use-products";
import { toast } from "sonner";
import type { CustomizationField } from "@/types";

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "dropdown", label: "Dropdown" },
  { value: "selection", label: "Selection (Radio)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
] as const;

interface Props {
  productId?: string;
  jouvertPackageId?: string;
  sectionVersionId?: string;
  productTitle: string;
}

export function CustomizationFieldsDialog({ productId, jouvertPackageId, sectionVersionId, productTitle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Manage custom fields">
          <Settings2 className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Custom Fields</DialogTitle>
          <DialogDescription className="text-xs">
            Define form fields buyers must fill out for <span className="font-medium text-foreground">{productTitle}</span>
          </DialogDescription>
        </DialogHeader>
        {open && <FieldsManager productId={productId} jouvertPackageId={jouvertPackageId} sectionVersionId={sectionVersionId} />}
      </DialogContent>
    </Dialog>
  );
}

function FieldsManager({ productId, jouvertPackageId, sectionVersionId }: { productId?: string; jouvertPackageId?: string; sectionVersionId?: string }) {
  const costumeFields = useCustomizationFields(productId);
  const jouvertFields = useJouvertCustomizationFields(jouvertPackageId);
  const versionFields = useVersionCustomizationFields(sectionVersionId);
  
  const { data: fields, isLoading } = sectionVersionId ? versionFields : productId ? costumeFields : jouvertFields;
  const createMutation = useCreateCustomizationField();
  const deleteMutation = useDeleteCustomizationField();

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<string>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim()) { toast.error("Field label is required"); return; }
    const optionsArr = (newType === "dropdown" || newType === "selection")
      ? newOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : [];
    if ((newType === "dropdown" || newType === "selection") && optionsArr.length < 2) {
      toast.error("Needs at least 2 options (comma-separated)");
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...(productId ? { product_id: productId } : {}),
        ...(jouvertPackageId ? { jouvert_package_id: jouvertPackageId } : {}),
        ...(sectionVersionId ? { section_version_id: sectionVersionId } : {}),
        field_label: newLabel.trim(),
        field_type: newType,
        options: optionsArr,
        required: newRequired,
        sort_order: (fields?.length || 0) + 1,
      });
      toast.success("Field added");
      setNewLabel(""); setNewType("text"); setNewRequired(false); setNewOptions("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add field");
    }
  };

  const handleDelete = async (field: CustomizationField) => {
    try {
      await deleteMutation.mutateAsync({ id: field.id });
      toast.success("Field removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete field");
    }
  };

  if (isLoading) {
    return <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading fields...</div>;
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Existing Fields */}
      {fields && fields.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Fields ({fields.length})</p>
          {fields.map((field) => (
            <div key={field.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-foreground">{field.field_label}</p>
                  {field.required && <Badge variant="destructive" className="text-[8px] px-1 py-0">Required</Badge>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[9px]">{FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}</Badge>
                  {(field.field_type === "dropdown" || field.field_type === "selection") && field.options?.length > 0 && (
                    <span className="text-[10px] text-muted-foreground truncate">{field.options.join(", ")}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleDelete(field)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-border rounded-lg">
          <p className="text-xs text-muted-foreground">No custom fields yet. Add one below.</p>
        </div>
      )}

      {/* Add New Field */}
      <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> Add Field
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. T-Shirt Size, Meal Choice"
            className="h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={newRequired}
                onCheckedChange={(v) => setNewRequired(v === true)}
              />
              <span className="text-xs text-foreground">Required</span>
            </label>
          </div>
        </div>

        {(newType === "dropdown" || newType === "selection") && (
          <div className="space-y-1.5">
            <Label className="text-xs">Options (comma-separated)</Label>
            <Input
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              placeholder={newType === "selection" ? "e.g. Johnnie Walker, Hennessy, Jack Daniels" : "e.g. Small, Medium, Large"}
              className="h-8 text-xs"
            />
          </div>
        )}

        <Button
          onClick={handleAdd}
          disabled={createMutation.isPending || !newLabel.trim()}
          size="sm"
          className="w-full rounded-full text-xs"
        >
          {createMutation.isPending ? "Adding..." : "Add Field"}
        </Button>
      </div>
    </div>
  );
}
