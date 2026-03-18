import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mb-5">Configure Ti'Fete platform fees and rules</p>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Fee Configuration</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ticket Fee %</Label>
                <Input defaultValue="10" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Resale Fee %</Label>
                <Input defaultValue="12" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Costume Fee %</Label>
                <Input defaultValue="7" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Marketplace Fee %</Label>
                <Input defaultValue="8" type="number" />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Currency & Payouts</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Currency</Label>
                <Input defaultValue="USD" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payout Frequency</Label>
                <Input defaultValue="Weekly" />
              </div>
            </div>
          </section>

          <Separator />

          <p className="text-xs text-muted-foreground">
            Settings are currently display-only. Database-backed settings will be added when needed.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
