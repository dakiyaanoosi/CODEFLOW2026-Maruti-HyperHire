import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">Gigs & Tasks</h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">Manage and track hyperlocal workforce gigs.</p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Gig Listings</CardTitle>
          <CardDescription className="text-brand-muted">Hyperlocal student workforce job listings.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center rounded-[10px] bg-brand-surface-soft text-sm text-brand-muted">
          Gig creation, discovery, and matching pipelines will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
