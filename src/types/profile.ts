export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type WorkCategory =
  | "Web Development"
  | "Mobile Development"
  | "UI/UX Design"
  | "Data Science"
  | "Machine Learning"
  | "Content Writing"
  | "Digital Marketing"
  | "Video Editing"
  | "Graphic Design"
  | "Backend Engineering"
  | "DevOps"
  | "Cybersecurity";

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface StudentProfile {
  name: string;
  college: string;
  bio: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  availability: string;
  preferredCategories: WorkCategory[];
  hourlyRate: number;
  portfolioLinks: string[];
  socialLinks: SocialLinks;
  trustScore: number;
  isVerified: boolean;
  profileStrength: number;
  avatarInitials: string;
  avatarUrl?: string;

  // Reputation Lifecycle Extensions
  averageRating?: number;
  reviewCount?: number;
  repeatClientRate?: number;
  verifiedProjectsCount?: number;
}

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

export const ALL_CATEGORIES: WorkCategory[] = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Data Science",
  "Machine Learning",
  "Content Writing",
  "Digital Marketing",
  "Video Editing",
  "Graphic Design",
  "Backend Engineering",
  "DevOps",
  "Cybersecurity",
];