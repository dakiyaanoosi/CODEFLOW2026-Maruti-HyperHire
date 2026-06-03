import { collection, query, where, onSnapshot, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentProfile } from "@/types/profile";
import { MinimalCandidatePayload } from "@/types/talent";

class TalentService {
  private activeStudents: (StudentProfile & { uid: string })[] = [];
  private unsubscribe: (() => void) | null = null;
  private listeners: ((students: (StudentProfile & { uid: string })[]) => void)[] = [];

  // One-time database cleanup for stale mock trust scores
  private async cleanStaleTrustScores() {
    if (!db) return;
    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      let updatedCount = 0;
      
      for (const userDoc of snap.docs) {
        const data = userDoc.data();
        if (data.trustScore && data.trustScore !== 0) {
          // Check if they have a real trust profile document
          const trustProfileRef = doc(db, "trustProfiles", userDoc.id);
          const trustProfileSnap = await getDoc(trustProfileRef);
          if (!trustProfileSnap.exists()) {
            console.log(`[TalentService] Queueing reset for stale trustScore of user ${userDoc.id} (${data.name})`);
            batch.set(userDoc.ref, { trustScore: 0 }, { merge: true });
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`[TalentService] Completed cleanup: reset trustScore for ${updatedCount} users.`);
      }
    } catch (e) {
      console.error("[TalentService] Stale trust score cleanup error:", e);
    }
  }

  // Initializes the global pool of students
  public boot() {
    if (this.unsubscribe || !db) return; // Already booted or firebase disabled

    console.log("[TalentService] Booting scalable candidate pool...");
    
    // Clean stale mock data in Firestore background
    this.cleanStaleTrustScores();

    const q = query(collection(db, "users"), where("role", "==", "student"));
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const students: (StudentProfile & { uid: string })[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as StudentProfile;
        // Verify it's a valid candidate
        if (data.name && data.skills) {
          students.push({ ...data, uid: doc.id });
        }
      });
      
      this.activeStudents = students;
      this.notifyListeners();
    }, (error) => {
      console.error("[TalentService] Error syncing candidate pool:", error);
    });
  }

  public shutdown() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }

  public subscribe(callback: (students: (StudentProfile & { uid: string })[]) => void) {
    this.listeners.push(callback);
    // Fire immediately with current state
    if (this.activeStudents.length > 0) {
      callback(this.activeStudents);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.activeStudents);
    }
  }

  // Generates the lightweight payload to send to FastAPI
  public getMinimalPayload(): MinimalCandidatePayload[] {
    return this.activeStudents.map(student => ({
      userId: student.uid,
      skills: student.skills || [],
      bioSnippet: student.bio ? student.bio.substring(0, 300) : "",
      trustScore: student.trustScore ?? 0,
      experienceLevel: student.experienceLevel || "Intermediate",
      preferredCategories: student.preferredCategories || []
    }));
  }
}

export const talentService = new TalentService();
