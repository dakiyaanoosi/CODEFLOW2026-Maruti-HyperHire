import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TalentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Pool</h1>
        <p className="text-muted-foreground">Browse and connect with skilled student talent.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Student Talent Profiles</CardTitle>
          <CardDescription>Hyperlocal student network matching.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Talent search, verified skill profiles, and messaging will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
