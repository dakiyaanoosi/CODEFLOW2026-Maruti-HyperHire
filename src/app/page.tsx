import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { AIIntelligence } from "@/components/landing/ai-intelligence";
import { Workflow } from "@/components/landing/workflow";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Landing Navigation Header */}
      <Header />

      {/* Main Page Layout Sections */}
      <div className="flex-1 flex flex-col">
        <Hero />
        <Stats />
        <Features />
        <AIIntelligence />
        <Workflow />
        <Testimonials />
        <CTA />
      </div>

      {/* Landing Sitemap Footer */}
      <Footer />
    </div>
  );
}
