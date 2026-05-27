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

export const MOCK_PROFILE: StudentProfile = {
  name: "Student Developer",
  college: "IIT Bombay",
  bio:
    "Full-stack developer passionate about building scalable web applications and intuitive user experiences. Currently pursuing B.Tech in Computer Science with a focus on distributed systems and AI-powered products.",
  skills: ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Tailwind CSS", "Next.js", "GraphQL"],
  experienceLevel: "Intermediate",
  availability: "20 hrs/week",
  preferredCategories: ["Web Development", "UI/UX Design", "Backend Engineering"],
  hourlyRate: 18,
  portfolioLinks: [
    "https://example.com/projects/project-1",
    "https://example.com/projects/project-2",
  ],
  socialLinks: {
    github: "https://github.com/student-dev",
    linkedin: "https://linkedin.com/in/student-dev",
    twitter: "https://twitter.com/student_dev",
    website: "https://studentdev.dev",
  },
  trustScore: 87,
  isVerified: true,
  profileStrength: 82,
  avatarInitials: "SD",
  avatarUrl: "",
};

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