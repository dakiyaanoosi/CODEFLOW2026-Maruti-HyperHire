import { Job } from "@/types/job";
import { JobWithMatchScore, MarketplaceFilters, TRENDING_CATEGORIES } from "@/types/marketplace";

// Score fit based on explicit overlap between user skills and job requirements.
export function computeMatchScore(job: Job, userSkills: string[]): number {
  if (!userSkills || userSkills.length === 0) {
    // Deterministic fallback baseline if no profile skills are set
    if (job.difficultyLevel === "Advanced") return 45;
    if (job.difficultyLevel === "Intermediate") return 60;
    return 75;
  }
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = job.requiredSkills.map((s) => s.toLowerCase());

  if (jobSkillsLower.length === 0) return 72;

  const matches = jobSkillsLower.filter((skill) =>
    userSkillsLower.some((us) => us.includes(skill) || skill.includes(us))
  ).length;

  const base = Math.round((matches / jobSkillsLower.length) * 75);
  // Deterministic bonus: 15 points if there are matches, otherwise 0
  const bonus = matches > 0 ? 15 : 0;
  return Math.min(99, base + bonus + 10);
}

export function enrichJobs(jobs: Job[], userSkills: string[]): JobWithMatchScore[] {
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  return jobs.map((job) => {
    const createdAt = new Date(job.createdAt).getTime();
    const isNew = now - createdAt < twoDays;
    const isTrending = TRENDING_CATEGORIES.includes(job.category);

    const existingScore = (job as Job & { matchScore?: number }).matchScore;
    const matchScore = typeof existingScore === "number" ? existingScore : computeMatchScore(job, userSkills);

    return {
      ...job,
      matchScore,
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

