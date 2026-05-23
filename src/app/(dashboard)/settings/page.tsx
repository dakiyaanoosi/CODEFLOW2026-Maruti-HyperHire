import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">Settings</h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">Configure your account and workspace preferences.</p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription className="text-brand-muted">Global workspace configuration.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center rounded-[10px] bg-brand-surface-soft text-sm text-brand-muted">
          Account settings, notification preferences, and team permissions will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
