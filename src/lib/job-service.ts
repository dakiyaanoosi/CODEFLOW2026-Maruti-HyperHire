import { collection, doc, getDoc, setDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
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
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (error) {
        console.error("Firestore getJobs error, falling back to simulated:", error);
        return this.getSimulatedJobsList(businessId, onlyPublished);
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
    
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
          return {
            ...docSnap.data(),
            jobId: docSnap.id,
          } as Job;
        }
        return null;
      } catch (error) {
        console.error("Firestore getJob error:", error);
        const jobs = getSimulatedJobs();
        return jobs[jobId] || null;
      }
    } else {
      const jobs = getSimulatedJobs();
      return jobs[jobId] || null;
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
      : "job_" + Math.random().toString(36).substring(2, 9);

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
        console.error("Firestore createJob error, saving to simulated:", error);
        this.saveSimulatedJob(newJob);
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
        console.error("Firestore updateJob error, updating in simulated:", error);
        this.saveSimulatedJob(updatedJob);
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
        console.error("Firestore deleteJob error, deleting from simulated:", error);
        this.deleteSimulatedJob(jobId);
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
  }
};
