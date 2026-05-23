import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the HyperHire workforce operating system.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Dashboard Workspace</CardTitle>
          <CardDescription>Hyperlocal workforce operations foundation.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Workspace UI and analytics will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
