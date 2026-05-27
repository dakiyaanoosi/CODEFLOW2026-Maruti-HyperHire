import { collection, doc, getDoc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { BusinessProfile } from "@/types/business";

const SIMULATED_BUSINESSES_KEY = "hyperhire_simulated_businesses";

// Helper to get simulated business profiles from localStorage
function getSimulatedBusinesses(): Record<string, BusinessProfile> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_BUSINESSES_KEY);
  return data ? JSON.parse(data) : {};
}

// Helper to save simulated business profiles to localStorage
function saveSimulatedBusinesses(businesses: Record<string, BusinessProfile>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_BUSINESSES_KEY, JSON.stringify(businesses));
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

export const businessService = {
  /**
   * Fetch a business profile by the owner's UID
   */
  async getBusinessProfileByOwner(ownerId: string): Promise<BusinessProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const businessesRef = collection(db, "businesses");
        const q = query(businessesRef, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          return {
            ...docSnap.data(),
            businessId: docSnap.id,
          } as BusinessProfile;
        }
        return null;
      } catch (error) {
        console.error("Firestore getBusinessProfileByOwner error:", error);
        throw error;
      }
    } else {
      return this.getSimulatedProfileByOwner(ownerId);
    }
  },

  /**
   * Helper to fetch simulated profile by owner UID
   */
  getSimulatedProfileByOwner(ownerId: string): BusinessProfile | null {
    const businesses = getSimulatedBusinesses();
    const matched = Object.values(businesses).find((b) => b.ownerId === ownerId);
    return matched || null;
  },

  /**
   * Create default organization profile document
   */
  async createDefaultBusinessProfile(
    ownerId: string,
    email: string,
    name: string
  ): Promise<BusinessProfile> {
    const businessId = isFirebaseConfigured && db
      ? doc(collection(db, "businesses")).id
      : "bus_" + Math.random().toString(36).substring(2, 9);

    const now = new Date().toISOString();
    const defaultProfile: BusinessProfile = {
      businessId,
      ownerId,
      companyName: name || "My Business Org",
      industry: "Technology",
      description: "",
      location: "",
      website: "",
      companySize: "1–10",
      hiringPreferences: {
        remote: true,
        partTime: false,
        fullTime: true,
        internship: false,
      },
      budgetRange: "< ₹10k/mo",
      logoUrl: "",
      verificationStatus: "Unverified",
      activeJobs: 0,
      totalHires: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "businesses", businessId);
        await setDoc(docRef, cleanFirestoreData(defaultProfile));
      } catch (error) {
        console.error("Firestore createDefaultBusinessProfile error:", error);
        throw error;
      }
    } else {
      this.saveSimulatedProfile(defaultProfile);
    }

    return defaultProfile;
  },

  /**
   * Helper to save simulated profile
   */
  saveSimulatedProfile(profile: BusinessProfile) {
    const businesses = getSimulatedBusinesses();
    businesses[profile.businessId] = profile;
    saveSimulatedBusinesses(businesses);
  },

  /**
   * Update business profile document
   */
  async updateBusinessProfile(
    businessId: string,
    data: Partial<Omit<BusinessProfile, "businessId" | "ownerId" | "createdAt" | "updatedAt">>
  ): Promise<BusinessProfile> {
    // Fetch current profile first
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "businesses", businessId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const current = docSnap.data() as BusinessProfile;
          const updated: BusinessProfile = {
            ...current,
            ...data,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, cleanFirestoreData(updated));

          // Update companyName on all jobs posted by this business
          if (data.companyName && data.companyName !== current.companyName) {
            try {
              const { jobService } = await import("./job-service");
              await jobService.updateBusinessJobsCompanyName(current.ownerId, data.companyName);
            } catch (err) {
              console.error("Failed to update company name on jobs:", err);
            }
          }

          return updated;
        }
      } catch (error) {
        console.error("Firestore updateBusinessProfile error:", error);
        throw error;
      }
    }

    // Simulated update fallback
    const businesses = getSimulatedBusinesses();
    const current = businesses[businessId];
    if (!current) {
      throw new Error(`Business profile not found: ${businessId}`);
    }

    const updated: BusinessProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    businesses[businessId] = updated;
    saveSimulatedBusinesses(businesses);

    // Update companyName on all simulated jobs posted by this business
    if (data.companyName && data.companyName !== current.companyName) {
      try {
        const { jobService } = await import("./job-service");
        jobService.updateSimulatedJobsCompanyName(current.ownerId, data.companyName);
      } catch (err) {
        console.error("Failed to update company name on simulated jobs:", err);
      }
    }

    return updated;
  },
};
