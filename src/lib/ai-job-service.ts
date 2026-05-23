import { JobDifficulty } from "@/types/job";
import { ALL_CATEGORIES } from "@/types/profile";

export interface AIJobAnalysis {
  aiExtractedSkills: string[];
  aiGeneratedSummary: string;
  aiDifficultyScore: number; // 1-10
  difficultyLevel: JobDifficulty;
  suggestedCategory: string;
}

/**
 * Simulates AI job analysis by analyzing keywords in the title and description.
 * Returns suggested skills, summaries, category suggestions, and estimated difficulty.
 */
export async function analyzeJobDescription(
  title: string,
  description: string
): Promise<AIJobAnalysis> {
  // Simulate AI processing delay (1.2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const combinedText = `${title} ${description}`.toLowerCase();
  const extractedSkillsSet = new Set<string>();
  let suggestedCategory = "Web Development";

  // Heuristic mapping for skills and categories
  if (
    combinedText.includes("react") ||
    combinedText.includes("next.js") ||
    combinedText.includes("frontend") ||
    combinedText.includes("nextjs") ||
    combinedText.includes("css") ||
    combinedText.includes("ui")
  ) {
    extractedSkillsSet.add("React");
    extractedSkillsSet.add("TypeScript");
    extractedSkillsSet.add("Tailwind CSS");
    extractedSkillsSet.add("Next.js");
    suggestedCategory = "Web Development";
  }

  if (
    combinedText.includes("node") ||
    combinedText.includes("express") ||
    combinedText.includes("backend") ||
    combinedText.includes("api") ||
    combinedText.includes("database") ||
    combinedText.includes("sql")
  ) {
    extractedSkillsSet.add("Node.js");
    extractedSkillsSet.add("REST APIs");
    extractedSkillsSet.add("Express.js");
    extractedSkillsSet.add("PostgreSQL");
    if (!combinedText.includes("react")) {
      suggestedCategory = "Backend Engineering";
    }
  }

  if (
    combinedText.includes("mobile") ||
    combinedText.includes("ios") ||
    combinedText.includes("android") ||
    combinedText.includes("flutter") ||
    combinedText.includes("react native")
  ) {
    extractedSkillsSet.add("React Native");
    extractedSkillsSet.add("Flutter");
    extractedSkillsSet.add("Mobile Dev");
    suggestedCategory = "Mobile Development";
  }

  if (
    combinedText.includes("design") ||
    combinedText.includes("figma") ||
    combinedText.includes("ux") ||
    combinedText.includes("ui/ux") ||
    combinedText.includes("wireframe")
  ) {
    extractedSkillsSet.add("Figma");
    extractedSkillsSet.add("UI/UX Design");
    extractedSkillsSet.add("Wireframing");
    extractedSkillsSet.add("User Research");
    suggestedCategory = "UI/UX Design";
  }

  if (
    combinedText.includes("video") ||
    combinedText.includes("edit") ||
    combinedText.includes("youtube") ||
    combinedText.includes("premiere") ||
    combinedText.includes("after effects")
  ) {
    extractedSkillsSet.add("Video Editing");
    extractedSkillsSet.add("Adobe Premiere");
    extractedSkillsSet.add("After Effects");
    extractedSkillsSet.add("Color Grading");
    suggestedCategory = "Video Editing";
  }

  if (
    combinedText.includes("marketing") ||
    combinedText.includes("seo") ||
    combinedText.includes("social media") ||
    combinedText.includes("facebook") ||
    combinedText.includes("ads")
  ) {
    extractedSkillsSet.add("Digital Marketing");
    extractedSkillsSet.add("SEO Optimization");
    extractedSkillsSet.add("Content Strategy");
    extractedSkillsSet.add("Social Media Ads");
    suggestedCategory = "Digital Marketing";
  }

  if (
    combinedText.includes("data") ||
    combinedText.includes("python") ||
    combinedText.includes("machine learning") ||
    combinedText.includes("ai") ||
    combinedText.includes("model") ||
    combinedText.includes("tensor")
  ) {
    extractedSkillsSet.add("Python");
    extractedSkillsSet.add("Data Analysis");
    extractedSkillsSet.add("Pandas");
    if (combinedText.includes("machine learning") || combinedText.includes("model")) {
      extractedSkillsSet.add("Machine Learning");
      extractedSkillsSet.add("TensorFlow");
      suggestedCategory = "Machine Learning";
    } else {
      suggestedCategory = "Data Science";
    }
  }

  if (
    combinedText.includes("write") ||
    combinedText.includes("content") ||
    combinedText.includes("blog") ||
    combinedText.includes("copywrite")
  ) {
    extractedSkillsSet.add("Content Writing");
    extractedSkillsSet.add("Copywriting");
    extractedSkillsSet.add("Proofreading");
    suggestedCategory = "Content Writing";
  }

  // Ensure we have at least some default skills if none were matched
  if (extractedSkillsSet.size === 0) {
    extractedSkillsSet.add("Problem Solving");
    extractedSkillsSet.add("Collaboration");
    extractedSkillsSet.add("Communication");
  }

  const aiExtractedSkills = Array.from(extractedSkillsSet);

  // Generate a summary
  let aiGeneratedSummary = `Looking for assistance with ${suggestedCategory.toLowerCase()} related deliverables. Tasks include participating in project sprints and shipping features.`;
  if (description.trim().length > 30) {
    // Take first sentence or first 120 chars
    const firstSentence = description.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 15) {
      aiGeneratedSummary = `${firstSentence.trim()}. This role focuses on executing the core requirements efficiently.`;
    } else {
      aiGeneratedSummary = `${description.substring(0, 100).trim()}... This gig leverages key skills in ${aiExtractedSkills.slice(0, 2).join(" & ")}.`;
    }
  }

  // Determine difficulty score (1-10) and level
  let aiDifficultyScore = 4; // default intermediate
  let difficultyLevel: JobDifficulty = "Intermediate";

  if (
    combinedText.includes("senior") ||
    combinedText.includes("expert") ||
    combinedText.includes("architecture") ||
    combinedText.includes("complex") ||
    combinedText.includes("advanced") ||
    combinedText.includes("lead")
  ) {
    aiDifficultyScore = Math.floor(Math.random() * 3) + 8; // 8-10
    difficultyLevel = "Advanced";
  } else if (
    combinedText.includes("junior") ||
    combinedText.includes("simple") ||
    combinedText.includes("basic") ||
    combinedText.includes("entry") ||
    combinedText.includes("beginner") ||
    combinedText.includes("easy")
  ) {
    aiDifficultyScore = Math.floor(Math.random() * 3) + 1; // 1-3
    difficultyLevel = "Beginner";
  } else {
    aiDifficultyScore = Math.floor(Math.random() * 4) + 4; // 4-7
    difficultyLevel = "Intermediate";
  }

  // Validate suggestedCategory against ALL_CATEGORIES
  if (!ALL_CATEGORIES.includes(suggestedCategory as any)) {
    suggestedCategory = ALL_CATEGORIES[0] || "Web Development";
  }

  return {
    aiExtractedSkills,
    aiGeneratedSummary,
    aiDifficultyScore,
    difficultyLevel,
    suggestedCategory,
  };
}
