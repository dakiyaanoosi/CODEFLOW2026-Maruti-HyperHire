import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gigs & Tasks</h1>
        <p className="text-muted-foreground">Manage and track hyperlocal workforce gigs.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Gig Listings</CardTitle>
          <CardDescription>Hyperlocal student workforce job listings.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Gig creation, discovery, and matching pipelines will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
