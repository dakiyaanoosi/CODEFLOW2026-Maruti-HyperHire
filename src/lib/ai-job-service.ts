import { JobDifficulty } from "@/types/job";
import { ALL_CATEGORIES } from "@/types/profile";

export interface AIJobAnalysis {
  aiExtractedSkills: string[];
  aiGeneratedSummary: string;
  aiDifficultyScore: number; // 1-10
  difficultyLevel: JobDifficulty;
  suggestedCategory: string;
  deliverables?: string[];
}

/**
 * Simulates AI job analysis by analyzing keywords in the title and description.
 * Returns suggested skills, summaries, category suggestions, and estimated difficulty.
 */
export async function analyzeJobDescription(
  title: string,
  description: string
): Promise<AIJobAnalysis> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://hyperhire-ai-engine.onrender.com";
    const res = await fetch(`${apiUrl}/job/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        aiExtractedSkills: data.aiExtractedSkills || [],
        aiGeneratedSummary: data.aiGeneratedSummary || "",
        aiDifficultyScore: data.aiDifficultyScore || 5,
        difficultyLevel: (data.difficultyLevel || "Intermediate") as JobDifficulty,
        suggestedCategory: data.suggestedCategory || "Web Development",
        deliverables: data.deliverables || [],
      };
    }
  } catch (err) {
    console.error("AI job analyze backend failed, falling back to local:", err);
  }

  // Local fallback (deterministic, no Math.random)
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
  let aiGeneratedSummary = `[Fallback Mode] Looking for assistance with ${suggestedCategory.toLowerCase()} related deliverables. Tasks include participating in project sprints and shipping features.`;
  if (description.trim().length > 30) {
    // Take first sentence or first 120 chars
    const firstSentence = description.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 15) {
      aiGeneratedSummary = `[Fallback Mode] ${firstSentence.trim()}. This role focuses on executing the core requirements efficiently.`;
    } else {
      aiGeneratedSummary = `[Fallback Mode] ${description.substring(0, 100).trim()}... This gig leverages key skills in ${aiExtractedSkills.slice(0, 2).join(" & ")}.`;
    }
  }

  // Determine difficulty score (1-10) and level
  let aiDifficultyScore = 5;
  let difficultyLevel: JobDifficulty = "Intermediate";

  if (
    combinedText.includes("senior") ||
    combinedText.includes("expert") ||
    combinedText.includes("architecture") ||
    combinedText.includes("complex") ||
    combinedText.includes("advanced") ||
    combinedText.includes("lead")
  ) {
    aiDifficultyScore = 8;
    difficultyLevel = "Advanced";
  } else if (
    combinedText.includes("junior") ||
    combinedText.includes("simple") ||
    combinedText.includes("basic") ||
    combinedText.includes("entry") ||
    combinedText.includes("beginner") ||
    combinedText.includes("easy")
  ) {
    aiDifficultyScore = 2;
    difficultyLevel = "Beginner";
  } else {
    aiDifficultyScore = 5;
    difficultyLevel = "Intermediate";
  }

  // Validate suggestedCategory against ALL_CATEGORIES
  if (!ALL_CATEGORIES.includes(suggestedCategory as typeof ALL_CATEGORIES[number])) {
    suggestedCategory = ALL_CATEGORIES[0] || "Web Development";
  }

  const deliverables: string[] = [];
  if (combinedText.includes("design") || combinedText.includes("ui")) {
    deliverables.push("Wireframes/Mockups", "Interactive Prototype", "Figma Design Tokens");
  } else if (combinedText.includes("api") || combinedText.includes("database") || combinedText.includes("backend")) {
    deliverables.push("API Schema & Routes", "Database Setup", "Integration Tests");
  } else {
    deliverables.push("Initial requirements draft", "Project implementation code", "Handover documentation");
  }

  return {
    aiExtractedSkills,
    aiGeneratedSummary,
    aiDifficultyScore,
    difficultyLevel,
    suggestedCategory,
    deliverables,
  };
}

export interface ApplicationEnhanceParams {
  coverLetter: string;
  proposalText: string;
  tone: string;
  jobTitle: string;
  jobDescription: string;
}

export interface ApplicationEnhanceResult {
  enhancedCoverMessage: string;
  enhancedProposalText: string;
  recommendedPrice?: number | null;
  recommendedDays?: number | null;
  upsellSuggestion?: string | null;
}

export async function enhanceApplicationPitch(params: ApplicationEnhanceParams): Promise<ApplicationEnhanceResult> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://hyperhire-ai-engine.onrender.com";
    const res = await fetch(`${apiUrl}/application/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverMessage: params.coverLetter,
        proposalText: params.proposalText,
        tone: params.tone,
        jobTitle: params.jobTitle,
        jobDescription: params.jobDescription,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI Engine Error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Enhance Application API failed, running local fallback:", err);
    
    // Deterministic JS Fallback
    const opener = params.tone.toLowerCase() === "conversational" ? "Hi," : "Dear Hiring Team,";
    const enhancedCoverMessage = 
      `[Fallback Mode]\n` +
      `${opener}\n\n` +
      `I'd like to work on ${params.jobTitle}. I can turn your requirements into clear deliverables with regular progress updates.\n\n` +
      `${params.coverLetter.trim()}\n\n` +
      `I can start by confirming scope, then share a concise execution plan before moving into delivery.`;
      
    const enhancedProposalText = 
      `### Proposed Approach (Fallback Mode)\n` +
      `1. Confirm success criteria, assets, timeline, and review points.\n` +
      `2. Execute the core work: ${params.proposalText.trim() || "complete the requested deliverables with documented progress"}.\n` +
      `3. Share a review build or draft, incorporate feedback, and hand over final files with notes.`;

    return {
      enhancedCoverMessage,
      enhancedProposalText,
      recommendedPrice: null,
      recommendedDays: 7,
      upsellSuggestion: "Add a short handover document and one structured revision round so the business can reuse the work confidently."
    };
  }
}
