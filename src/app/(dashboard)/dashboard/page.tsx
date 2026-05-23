import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">Dashboard</h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">Welcome to the HyperHire workforce operating system.</p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Dashboard Workspace</CardTitle>
          <CardDescription className="text-brand-muted">Hyperlocal workforce operations foundation.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center rounded-[10px] bg-brand-surface-soft text-sm text-brand-muted">
          Workspace UI and analytics will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
