import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { UserProfile } from "@/store/use-auth-store";

const SIMULATED_USERS_KEY = "hyperhire_simulated_users";
const SIMULATED_SESSION_KEY = "hyperhire_simulated_session";

// Helper to get simulated users from localStorage
function getSimulatedUsers(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_USERS_KEY);
  return data ? JSON.parse(data) : {};
}

// Helper to save simulated users to localStorage
function saveSimulatedUsers(users: Record<string, UserProfile>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
  }
}

// Helper to update active simulated session in localStorage
function updateSimulatedSession(profile: UserProfile) {
  if (typeof window === "undefined") return;
  const sessionData = localStorage.getItem(SIMULATED_SESSION_KEY);
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session.user && session.user.uid === profile.uid) {
        session.profile = profile;
        localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(session));
      }
    } catch (e) {
      console.error("Error updating simulated session:", e);
    }
  }
}

// Calculate profile strength based on filled fields
export function computeProfileStrength(p: Partial<UserProfile>): number {
  let score = 0;
  if (p.name) score += 10;
  if (p.college) score += 10;
  if (p.bio && p.bio.length > 30) score += 15;
  if (p.skills && p.skills.length >= 3) score += 15;
  if (p.skills && p.skills.length >= 6) score += 5;
  if (p.preferredCategories && p.preferredCategories.length >= 1) score += 10;
  if (p.hourlyRate && p.hourlyRate > 0) score += 10;
  if (p.availability) score += 5;
  if (p.portfolioLinks && p.portfolioLinks.length >= 1) score += 10;
  if (p.socialLinks && (p.socialLinks.github || p.socialLinks.linkedin)) score += 10;
  return Math.min(score, 100);
}

// Get initials for avatar
export function getAvatarInitials(name: string): string {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const profileService = {
  /**
   * Fetch profile document from Firestore or simulated database
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } else {
      const users = getSimulatedUsers();
      return users[uid] || null;
    }
  },

  /**
   * Create default profile document in Firestore or simulated database
   */
  async createDefaultStudentProfile(
    uid: string,
    email: string,
    name: string
  ): Promise<UserProfile> {
    const displayName = name || "Student Talent";
    const newProfile: UserProfile = {
      uid,
      role: "student",
      name: displayName,
      email: email || "",
      bio: "",
      college: "",
      skills: [],
      experienceLevel: "Beginner",
      availability: "",
      preferredCategories: [],
      hourlyRate: 0,
      trustScore: 80,
      verificationStatus: "Unverified",
      portfolioLinks: [],
      socialLinks: {},
      profileStrength: 10,
      avatarInitials: getAvatarInitials(displayName),
      avatarUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, newProfile);
    } else {
      const users = getSimulatedUsers();
      users[uid] = newProfile;
      saveSimulatedUsers(users);
      updateSimulatedSession(newProfile);
    }

    return newProfile;
  },

  /**
   * Update student profile document in Firestore or simulated database
   */
  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const currentProfile = await this.getProfile(uid);
    if (!currentProfile) {
      throw new Error(`Profile not found for UID: ${uid}`);
    }

    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate avatar initials if name changes
    if (data.name) {
      updatedProfile.avatarInitials = getAvatarInitials(data.name);
    }

    // Recalculate profile strength
    updatedProfile.profileStrength = computeProfileStrength(updatedProfile);

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, updatedProfile);
    } else {
      const users = getSimulatedUsers();
      users[uid] = updatedProfile;
      saveSimulatedUsers(users);
      updateSimulatedSession(updatedProfile);
    }

    return updatedProfile;
  },

  /**
   * Fetch and auto-create profile if missing
   */
  async ensureProfileExists(
    uid: string,
    email: string,
    name: string
  ): Promise<UserProfile> {
    const existing = await this.getProfile(uid);
    if (existing) {
      return existing;
    }
    return this.createDefaultStudentProfile(uid, email, name);
  },
};
