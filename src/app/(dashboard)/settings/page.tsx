import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your account and workspace preferences.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Global workspace configuration.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Account settings, notification preferences, and team permissions will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
