import { collection, doc, getDoc, setDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { generateId } from "@/lib/id-utils";
import { Job } from "@/types/job";

const SIMULATED_JOBS_KEY = "hyperhire_simulated_jobs";

// Helper to get simulated jobs from localStorage
function getSimulatedJobs(): Record<string, Job> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_JOBS_KEY);
  return data ? JSON.parse(data) : {};
}

// Helper to save simulated jobs to localStorage
function saveSimulatedJobs(jobs: Record<string, Job>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_JOBS_KEY, JSON.stringify(jobs));
  }
}

// Helper to get simulated business profiles and map ownerIds to company names
function getSimulatedBusinessesMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem("hyperhire_simulated_businesses");
    if (!data) return {};
    const businesses = JSON.parse(data) as Record<string, { ownerId?: string; companyName?: string }>;
    const map: Record<string, string> = {};
    Object.values(businesses).forEach((b) => {
      if (b.ownerId && b.companyName) {
        map[b.ownerId] = b.companyName;
      }
    });
    return map;
  } catch (e) {
    console.error("Failed to parse simulated businesses for company name resolution:", e);
    return {};
  }
}

// Helper to remove undefined properties before writing to Firestore
function cleanFirestoreData(data: any) {
  const clean: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
}

export const jobService = {
  /**
   * Fetch all jobs, with optional filters
   */
  async getJobs(businessId?: string, onlyPublished?: boolean): Promise<Job[]> {
    if (isFirebaseConfigured && db) {
      try {
        const jobsRef = collection(db, "jobs");
        let q;
        
        if (businessId && onlyPublished) {
          q = query(
            jobsRef,
            where("businessId", "==", businessId),
            where("status", "==", "Published")
          );
        } else if (businessId) {
          q = query(jobsRef, where("businessId", "==", businessId));
        } else if (onlyPublished) {
          q = query(jobsRef, where("status", "==", "Published"));
        } else {
          q = query(jobsRef);
        }
        
        const querySnapshot = await getDocs(q);
        const items: Job[] = [];
        
        querySnapshot.forEach((doc) => {
          items.push({
            ...doc.data(),
            jobId: doc.id,
          } as Job);
        });

        // Sort in memory to avoid index requirements in Firestore
        const sortedJobs = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Resolve company names dynamically from business profiles
        try {
          const businessIds = Array.from(new Set(sortedJobs.map((j) => j.businessId)));
          if (businessIds.length > 0) {
            const businessesRef = collection(db, "businesses");
            const profilesMap: Record<string, string> = {};
            
            // Chunk businessIds into arrays of 30
            const chunks: string[][] = [];
            for (let i = 0; i < businessIds.length; i += 30) {
              chunks.push(businessIds.slice(i, i + 30));
            }
            
            for (const chunk of chunks) {
              const bQuery = query(businessesRef, where("ownerId", "in", chunk));
              const bSnapshot = await getDocs(bQuery);
              bSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.ownerId && data.companyName) {
                  profilesMap[data.ownerId] = data.companyName;
                }
              });
            }
            
            sortedJobs.forEach((job) => {
              if (profilesMap[job.businessId]) {
                job.companyName = profilesMap[job.businessId];
              }
            });
          }
        } catch (bizErr) {
          console.error("Failed to dynamically resolve company names from Firestore profiles:", bizErr);
        }

        return sortedJobs;
      } catch (error) {
        console.error("Firestore getJobs error:", error);
        throw error;
      }
    } else {
      return this.getSimulatedJobsList(businessId, onlyPublished);
    }
  },

  /**
   * Fetch from simulated local storage database
   */
  getSimulatedJobsList(businessId?: string, onlyPublished?: boolean): Job[] {
    const jobs = getSimulatedJobs();
    let list = Object.values(jobs);
    
    if (businessId) {
      list = list.filter((j) => j.businessId === businessId);
    }
    if (onlyPublished) {
      list = list.filter((j) => j.status === "Published");
    }
    
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    try {
      const bizMap = getSimulatedBusinessesMap();
      sorted.forEach((job) => {
        if (bizMap[job.businessId]) {
          job.companyName = bizMap[job.businessId];
        }
      });
    } catch (e) {
      console.error("Failed to dynamically resolve simulated company names:", e);
    }

    return sorted;
  },

  /**
   * Fetch a single job post by jobId
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const job = {
            ...docSnap.data(),
            jobId: docSnap.id,
          } as Job;

          // Resolve company name dynamically
          try {
            const businessesRef = collection(db, "businesses");
            const q = query(businessesRef, where("ownerId", "==", job.businessId));
            const bSnapshot = await getDocs(q);
            if (!bSnapshot.empty) {
              const bData = bSnapshot.docs[0].data();
              if (bData.companyName) {
                job.companyName = bData.companyName;
              }
            }
          } catch (bizErr) {
            console.error("Failed to dynamically resolve company name for single job:", bizErr);
          }

          return job;
        }
        return null;
      } catch (error) {
        console.error("Firestore getJob error:", error);
        throw error;
      }
    } else {
      const jobs = getSimulatedJobs();
      const job = jobs[jobId] || null;
      if (job) {
        const bizMap = getSimulatedBusinessesMap();
        if (bizMap[job.businessId]) {
          job.companyName = bizMap[job.businessId];
        }
      }
      return job;
    }
  },

  /**
   * Create a new job post
   */
  async createJob(
    item: Omit<Job, "jobId" | "createdAt" | "updatedAt">
  ): Promise<Job> {
    const jobId = isFirebaseConfigured && db 
      ? doc(collection(db, "jobs")).id 
      : generateId("job");

    const now = new Date().toISOString();
    
    const newJob: Job = {
      ...item,
      jobId,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "jobs", jobId);
        await setDoc(docRef, cleanFirestoreData(newJob));
      } catch (error) {
        console.error("Firestore createJob error:", error);
        throw error;
      }
    } else {
      this.saveSimulatedJob(newJob);
    }

    return newJob;
  },

  /**
   * Save simulated job
   */
  saveSimulatedJob(item: Job) {
    const jobs = getSimulatedJobs();
    jobs[item.jobId] = item;
    saveSimulatedJobs(jobs);
  },

  /**
   * Update an existing job post
   */
  async updateJob(
    jobId: string,
    data: Partial<Omit<Job, "jobId" | "businessId" | "createdAt" | "updatedAt">>
  ): Promise<Job> {
    const currentItem = await this.getJob(jobId);
    if (!currentItem) {
      throw new Error(`Job post not found: ${jobId}`);
    }

    const updatedJob: Job = {
      ...currentItem,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "jobs", jobId);
        await setDoc(docRef, cleanFirestoreData(updatedJob));
      } catch (error) {
        console.error("Firestore updateJob error:", error);
        throw error;
      }
    } else {
      this.saveSimulatedJob(updatedJob);
    }

    return updatedJob;
  },

  /**
   * Delete a job post
   */
  async deleteJob(jobId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "jobs", jobId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Firestore deleteJob error:", error);
        throw error;
      }
    } else {
      this.deleteSimulatedJob(jobId);
    }
  },

  /**
   * Delete simulated job
   */
  deleteSimulatedJob(jobId: string) {
    const jobs = getSimulatedJobs();
    if (jobs[jobId]) {
      delete jobs[jobId];
      saveSimulatedJobs(jobs);
    }
  },

  /**
   * Update company name for all jobs posted by a business
   */
  async updateBusinessJobsCompanyName(businessId: string, companyName: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const jobsRef = collection(db, "jobs");
        const q = query(jobsRef, where("businessId", "==", businessId));
        const querySnapshot = await getDocs(q);
        
        const promises = querySnapshot.docs.map((doc) => {
          const jobRef = doc.ref;
          return setDoc(jobRef, { companyName }, { merge: true });
        });
        await Promise.all(promises);
      } catch (error) {
        console.error("Firestore updateBusinessJobsCompanyName error:", error);
        throw error;
      }
    } else {
      this.updateSimulatedJobsCompanyName(businessId, companyName);
    }
  },

  updateSimulatedJobsCompanyName(businessId: string, companyName: string) {
    const jobs = getSimulatedJobs();
    let updated = false;
    Object.values(jobs).forEach((job) => {
      if (job.businessId === businessId) {
        job.companyName = companyName;
        updated = true;
      }
    });
    if (updated) {
      saveSimulatedJobs(jobs);
    }
  }
};
