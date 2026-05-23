import { Job } from "@/types/job";
import { JobWithMatchScore, MarketplaceFilters, TRENDING_CATEGORIES } from "@/types/marketplace";

// Score fit based on explicit overlap between user skills and job requirements.
export function computeMatchScore(job: Job, userSkills: string[]): number {
  if (!userSkills || userSkills.length === 0) {
    // Random plausible score if no profile skills
    return Math.floor(40 + Math.random() * 55);
  }
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = job.requiredSkills.map((s) => s.toLowerCase());

  if (jobSkillsLower.length === 0) return 72;

  const matches = jobSkillsLower.filter((skill) =>
    userSkillsLower.some((us) => us.includes(skill) || skill.includes(us))
  ).length;

  const base = Math.round((matches / jobSkillsLower.length) * 70);
  // bonus for category match and difficulty proximity
  const bonus = Math.floor(Math.random() * 25);
  return Math.min(99, base + bonus + 10);
}

export function enrichJobs(jobs: Job[], userSkills: string[]): JobWithMatchScore[] {
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  return jobs.map((job) => {
    const createdAt = new Date(job.createdAt).getTime();
    const isNew = now - createdAt < twoDays;
    const isTrending = TRENDING_CATEGORIES.includes(job.category);

    return {
      ...job,
      matchScore: computeMatchScore(job, userSkills),
      isTrending,
      isNew,
    };
  });
}

export function applyFilters(
  jobs: JobWithMatchScore[],
  filters: MarketplaceFilters
): JobWithMatchScore[] {
  const now = new Date();

  return jobs.filter((job) => {
    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const searchable = [
        job.title,
        job.description,
        job.companyName,
        job.category,
        ...(job.requiredSkills || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Category
    if (filters.categories.length > 0 && !filters.categories.includes(job.category)) {
      return false;
    }

    // Work Mode
    if (filters.workModes.length > 0 && !filters.workModes.includes(job.workMode)) {
      return false;
    }

    // Difficulty
    if (
      filters.difficulties.length > 0 &&
      !filters.difficulties.includes(job.difficultyLevel)
    ) {
      return false;
    }

    // Budget
    if (filters.budgetMin !== null && job.budget < filters.budgetMin) return false;
    if (filters.budgetMax !== null && job.budget > filters.budgetMax) return false;

    // Skills filter
    if (filters.skills.length > 0) {
      const jobSkillsLower = job.requiredSkills.map((s) => s.toLowerCase());
      const hasMatch = filters.skills.some((s) =>
        jobSkillsLower.some((js) => js.includes(s.toLowerCase()))
      );
      if (!hasMatch) return false;
    }

    // Deadline filter
    const deadline = new Date(job.deadline);
    if (filters.deadlineFilter === "this-week") {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      if (deadline > weekEnd || deadline < now) return false;
    } else if (filters.deadlineFilter === "this-month") {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      if (deadline > monthEnd || deadline < now) return false;
    } else if (filters.deadlineFilter === "next-month") {
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      if (deadline < nextMonthStart || deadline > nextMonthEnd) return false;
    }

    return true;
  });
}

export function sortJobs(
  jobs: JobWithMatchScore[],
  sortBy: MarketplaceFilters["sortBy"]
): JobWithMatchScore[] {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case "relevance":
        return b.matchScore - a.matchScore;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "budget-high":
        return b.budget - a.budget;
      case "budget-low":
        return a.budget - b.budget;
      default:
        return 0;
    }
  });
}

// Generate mock jobs for demo/empty state
export function generateMockJobs(): Job[] {
  const now = new Date();
  const addDays = (d: number) =>
    new Date(now.getTime() + d * 86400000).toISOString();

  return [
    {
      jobId: "mock-1",
      businessId: "b1",
      companyName: "Nexus Labs",
      title: "React Dashboard UI Engineer",
      description:
        "Build a real-time analytics dashboard with interactive charts, dark mode, and responsive design.",
      category: "Web Development",
      requiredSkills: ["React", "TypeScript", "Tailwind CSS", "Recharts"],
      budget: 850,
      deadline: addDays(12),
      difficultyLevel: "Intermediate",
      workMode: "Remote",
      deliverables: ["Dashboard UI", "Chart Components", "Dark Mode Support"],
      status: "Published",
      aiGeneratedSummary:
        "Build a high-fidelity analytics dashboard with React and interactive data visualizations.",
      aiExtractedSkills: ["React", "TypeScript", "Tailwind"],
      aiDifficultyScore: 6,
      createdAt: addDays(-1),
      updatedAt: addDays(-1),
    },
    {
      jobId: "mock-2",
      businessId: "b2",
      companyName: "Vanta AI",
      title: "ML Model Fine-Tuning Specialist",
      description:
        "Fine-tune a pre-trained LLM on domain-specific data for customer support automation.",
      category: "Machine Learning",
      requiredSkills: ["Python", "PyTorch", "Hugging Face", "NLP"],
      budget: 1400,
      deadline: addDays(20),
      difficultyLevel: "Advanced",
      workMode: "Remote",
      deliverables: ["Fine-tuned model", "Evaluation report"],
      status: "Published",
      aiGeneratedSummary:
        "Fine-tune a transformer model for automated customer support in a production environment.",
      aiExtractedSkills: ["Python", "LLM", "NLP"],
      aiDifficultyScore: 9,
      createdAt: addDays(-2),
      updatedAt: addDays(-2),
    },
    {
      jobId: "mock-3",
      businessId: "b3",
      companyName: "Sprout Studio",
      title: "Mobile App UI/UX Designer",
      description:
        "Design a fitness tracking app with clean, motivational UI. Need wireframes, prototypes, and final assets.",
      category: "UI/UX Design",
      requiredSkills: ["Figma", "Prototyping", "Design Systems", "Mobile UX"],
      budget: 620,
      deadline: addDays(8),
      difficultyLevel: "Intermediate",
      workMode: "Hybrid",
      deliverables: ["Wireframes", "Figma Prototype", "Asset Export"],
      status: "Published",
      aiGeneratedSummary:
        "Create a clean, motivational mobile UI for a fitness tracking application in Figma.",
      aiExtractedSkills: ["Figma", "Mobile UX"],
      aiDifficultyScore: 5,
      createdAt: addDays(-3),
      updatedAt: addDays(-3),
    },
    {
      jobId: "mock-4",
      businessId: "b4",
      companyName: "DataFlow Inc.",
      title: "Python Data Pipeline Engineer",
      description:
        "Build ETL pipelines for streaming telemetry data into a data warehouse. Experience with Airflow is a plus.",
      category: "Data Science",
      requiredSkills: ["Python", "Apache Airflow", "SQL", "AWS S3"],
      budget: 1100,
      deadline: addDays(25),
      difficultyLevel: "Advanced",
      workMode: "Remote",
      deliverables: ["ETL Pipeline", "Documentation", "Tests"],
      status: "Published",
      aiGeneratedSummary:
        "Architect and deploy robust ETL pipelines for real-time telemetry data ingestion.",
      aiExtractedSkills: ["Python", "ETL", "Airflow"],
      aiDifficultyScore: 8,
      createdAt: addDays(-5),
      updatedAt: addDays(-5),
    },
    {
      jobId: "mock-5",
      businessId: "b5",
      companyName: "Pixel Craft Co.",
      title: "WordPress Theme Developer",
      description:
        "Customize a WooCommerce store theme, add custom product filters, and optimize for mobile performance.",
      category: "Web Development",
      requiredSkills: ["WordPress", "PHP", "WooCommerce", "CSS"],
      budget: 380,
      deadline: addDays(6),
      difficultyLevel: "Beginner",
      workMode: "Remote",
      deliverables: ["Custom Theme", "Filter Plugin", "Performance Report"],
      status: "Published",
      aiGeneratedSummary:
        "Customize and optimize a WooCommerce store with advanced product filtering.",
      aiExtractedSkills: ["WordPress", "PHP"],
      aiDifficultyScore: 3,
      createdAt: addDays(-1),
      updatedAt: addDays(-1),
    },
    {
      jobId: "mock-6",
      businessId: "b6",
      companyName: "NovaBrand",
      title: "Brand Identity & Logo Design",
      description:
        "Create a complete brand identity kit for a B2B SaaS startup. Includes logo, color palette, typography guide.",
      category: "Graphic Design",
      requiredSkills: ["Adobe Illustrator", "Branding", "Typography", "Logo Design"],
      budget: 750,
      deadline: addDays(15),
      difficultyLevel: "Intermediate",
      workMode: "Remote",
      deliverables: ["Logo Suite", "Brand Guidelines", "Color System"],
      status: "Published",
      aiGeneratedSummary:
        "Design a complete brand identity kit with logos and guidelines for a SaaS startup.",
      aiExtractedSkills: ["Branding", "Logo Design", "Illustrator"],
      aiDifficultyScore: 6,
      createdAt: addDays(-4),
      updatedAt: addDays(-4),
    },
    {
      jobId: "mock-7",
      businessId: "b7",
      companyName: "ContentPilot",
      title: "Technical Blog Writer",
      description:
        "Write 8 in-depth articles on DevOps, CI/CD pipelines, and cloud architecture. Must include code snippets.",
      category: "Content Writing",
      requiredSkills: ["Technical Writing", "DevOps", "Git", "Cloud"],
      budget: 480,
      deadline: addDays(30),
      difficultyLevel: "Intermediate",
      workMode: "Remote",
      deliverables: ["8 Articles", "Code Snippets", "SEO Optimization"],
      status: "Published",
      aiGeneratedSummary:
        "Produce technical blog content on DevOps and cloud infrastructure with illustrative code examples.",
      aiExtractedSkills: ["Technical Writing", "DevOps"],
      aiDifficultyScore: 5,
      createdAt: addDays(-7),
      updatedAt: addDays(-7),
    },
    {
      jobId: "mock-8",
      businessId: "b8",
      companyName: "SwiftEdge",
      title: "iOS Swift App Developer",
      description:
        "Build a habit-tracking iOS app with local notifications, streak system, and iCloud sync.",
      category: "Mobile Development",
      requiredSkills: ["Swift", "SwiftUI", "CoreData", "CloudKit"],
      budget: 1200,
      deadline: addDays(40),
      difficultyLevel: "Advanced",
      workMode: "Remote",
      deliverables: ["iOS App", "TestFlight Build", "Documentation"],
      status: "Published",
      aiGeneratedSummary:
        "Develop a Swift habit-tracking app with cloud sync, streak logic, and local notifications.",
      aiExtractedSkills: ["Swift", "iOS", "SwiftUI"],
      aiDifficultyScore: 8,
      createdAt: addDays(-2),
      updatedAt: addDays(-2),
    },
  ];
}
