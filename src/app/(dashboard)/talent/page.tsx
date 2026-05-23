import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TalentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">Talent Pool</h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">Browse and connect with skilled student talent.</p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Student Talent Profiles</CardTitle>
          <CardDescription className="text-brand-muted">Hyperlocal student network matching.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center rounded-[10px] bg-brand-surface-soft text-sm text-brand-muted">
          Talent search, verified skill profiles, and messaging will be implemented in subsequent phases.
        </CardContent>
      </Card>
    </div>
  );
}
