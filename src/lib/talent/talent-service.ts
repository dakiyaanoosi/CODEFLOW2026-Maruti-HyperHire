import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentProfile } from "@/types/profile";
import { MinimalCandidatePayload } from "@/types/talent";

class TalentService {
  private activeStudents: (StudentProfile & { uid: string })[] = [];
  private unsubscribe: (() => void) | null = null;
  private listeners: ((students: (StudentProfile & { uid: string })[]) => void)[] = [];

  // Initializes the global pool of students
  public boot() {
    if (this.unsubscribe || !db) return; // Already booted or firebase disabled

    console.log("[TalentService] Booting scalable candidate pool...");
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
      trustScore: student.trustScore || 80,
      experienceLevel: student.experienceLevel || "Intermediate",
      preferredCategories: student.preferredCategories || []
    }));
  }
}

export const talentService = new TalentService();
