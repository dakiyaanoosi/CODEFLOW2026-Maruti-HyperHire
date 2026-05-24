import { aiFetch } from "./client";
import {
  MatchWeights,
  CandidateWithPortfolios,
  MatchResponse,
  RecommendResponse,
  ScoreResponse,
  EmbedResponse
} from "./types";
import { Job } from "@/types/job";
import { StudentProfile } from "@/types/profile";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { portfolioService } from "@/lib/portfolio-service";

const SIMULATED_USERS_KEY = "hyperhire_simulated_users";

export const aiService = {
  /**
   * Fetches all student candidates from Firestore or simulated localStorage and maps them to CandidateWithPortfolios.
   */
  async getAllCandidates(): Promise<CandidateWithPortfolios[]> {
    let studentProfiles: (StudentProfile & { uid: string })[] = [];

    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "student"));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          studentProfiles.push({
            ...(doc.data() as StudentProfile),
            uid: doc.id,
          });
        });
      } catch (error) {
        console.error("Firestore error fetching candidates, checking simulated:", error);
        studentProfiles = this.getSimulatedCandidates();
      }
    } else {
      studentProfiles = this.getSimulatedCandidates();
    }

    // Pack each profile with its portfolio items
    const candidates: CandidateWithPortfolios[] = [];
    for (const profile of studentProfiles) {
      const portfolios = await portfolioService.getPortfolios(profile.uid);
      candidates.push({
        id: profile.uid,
        profile,
        portfolios,
      });
    }

    return candidates;
  },

  getSimulatedCandidates(): (StudentProfile & { uid: string })[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(SIMULATED_USERS_KEY);
    if (!data) return [];
    try {
      const usersMap = JSON.parse(data);
      return Object.values(usersMap).filter(
        (u: any) => u.role === "student"
      ) as (StudentProfile & { uid: string })[];
    } catch (e) {
      console.error("Failed to parse simulated candidates", e);
      return [];
    }
  },

  /**
   * Queries the AI Engine /match endpoint to rank multiple candidates for a single job.
   */
  async matchCandidatesForJob(
    job: Job,
    candidates: CandidateWithPortfolios[],
    weights?: MatchWeights
  ): Promise<MatchResponse> {
    if (candidates.length === 0) {
      return { job_id: job.jobId, ranked_candidates: [] };
    }
    return aiFetch<MatchResponse>("/match", {
      method: "POST",
      body: JSON.stringify({ job, candidates, weights }),
    });
  },

  /**
   * Queries the AI Engine /recommend endpoint to rank multiple jobs for a single candidate.
   */
  async recommendJobsForStudent(
    candidate: CandidateWithPortfolios,
    jobs: Job[],
    weights?: MatchWeights
  ): Promise<RecommendResponse> {
    if (jobs.length === 0) {
      return { candidate_id: candidate.id, ranked_jobs: [] };
    }
    return aiFetch<RecommendResponse>("/recommend", {
      method: "POST",
      body: JSON.stringify({ candidate, jobs, weights }),
    });
  },

  /**
   * Queries the AI Engine /score endpoint to evaluate a single candidate against a single job.
   */
  async scoreCandidateAndJob(
    job: Job,
    candidate: CandidateWithPortfolios,
    weights?: MatchWeights
  ): Promise<ScoreResponse> {
    return aiFetch<ScoreResponse>("/score", {
      method: "POST",
      body: JSON.stringify({ job, candidate, weights }),
    });
  },

  /**
   * Queries the AI Engine /embed endpoint to fetch raw vector embeddings for text inputs.
   */
  async getEmbeddings(texts: string[]): Promise<EmbedResponse> {
    return aiFetch<EmbedResponse>("/embed", {
      method: "POST",
      body: JSON.stringify({ texts }),
    });
  }
};
