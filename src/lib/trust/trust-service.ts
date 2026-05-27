import { db } from "@/lib/firebase";
import { generateId } from "@/lib/id-utils";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  limit
} from "firebase/firestore";
import { TrustEvent, TrustProfile, TrustDimension, UserRole } from "@/types/trust";
import { trustEngine } from "./trust-engine";
import { getBusinessDocRefByOwnerId } from "../business/business-lookup";

export const trustService = {
  /**
   * Subscribes to the live Trust Profile of a user.
   */
  subscribeToTrustProfile(userId: string, callback: (profile: TrustProfile | null) => void) {
    if (!db) return () => {};
    const ref = doc(db, "trustProfiles", userId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as TrustProfile);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Subscribes to the live history of trust events.
   */
  subscribeToTrustHistory(userId: string, callback: (events: TrustEvent[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, "trustHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const events = snap.docs.map(doc => doc.data() as TrustEvent);
      callback(events);
    });
  },

  /**
   * Core pipeline: Logs a trust event and orchestrates the recalculation of the profile.
   */
  async logTrustEvent(
    userId: string,
    role: UserRole,
    dimension: TrustDimension,
    impactScore: number,
    reason: string,
    relatedEntityId?: string,
    relatedEntityType?: "workflow" | "task" | "application" | "message"
  ) {
    if (!db) return;

    const eventId = generateId("trust");
    const now = new Date().toISOString();

    const event: TrustEvent = {
      eventId,
      userId,
      role,
      dimension,
      impactScore,
      reason,
      relatedEntityId,
      relatedEntityType,
      createdAt: now
    };

    const batch = writeBatch(db);

    // 1. Log the atomic event
    const eventRef = doc(db, "trustHistory", eventId);
    batch.set(eventRef, event);

    // 2. Fetch all historical events to recalculate (in a real prod environment we'd use cloud functions + aggregated counters)
    const q = query(collection(db, "trustHistory"), where("userId", "==", userId));
    const historySnap = await getDocs(q);
    const history = historySnap.docs.map(d => d.data() as TrustEvent);
    history.push(event); // Include the new event

    // 3. Recalculate
    const overallScore = trustEngine.calculateDecayedScore(history);
    const rank = trustEngine.calculateRank(overallScore);
    const dimensions = trustEngine.calculateDimensions(history);
    const volatilityIndex = trustEngine.calculateVolatility(history);
    const trend = trustEngine.calculateTrend(history);

    // Derive percentile from normalized score (full implementation would scan all users)
    const percentile = Math.min(99, Math.round((overallScore / 100) * 100));

    const newProfile: TrustProfile = {
      userId,
      role,
      overallScore,
      rank,
      dimensions,
      percentile,
      trend,
      volatilityIndex,
      lastCalculatedAt: now
    };

    // 4. Update the profile
    const profileRef = doc(db, "trustProfiles", userId);
    batch.set(profileRef, newProfile, { merge: true });

    await batch.commit();

    // 5. Update user/business object's denormalized trust score for easy querying
    let userRef;
    if (role === "student") {
      userRef = doc(db, "users", userId);
    } else {
      try {
        const resolvedRef = await getBusinessDocRefByOwnerId(userId);
        if (!resolvedRef) {
          console.warn(`[Trust Service] Missing business profile for owner ID: ${userId}. Creating dynamic fallback.`);
          const { businessService } = await import("../business-service");
          let name = "My Business Org";
          let email = "";
          try {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              name = uData.name || name;
              email = uData.email || email;
            }
          } catch (e) {
            console.error("[Trust Service] Failed to retrieve user details for business profile fallback:", e);
          }
          const defaultProfile = await businessService.createDefaultBusinessProfile(userId, email, name);
          userRef = doc(db, "businesses", defaultProfile.businessId);
        } else {
          userRef = resolvedRef;
        }
      } catch (err) {
        console.error(`[Trust Service] Error resolving business document for owner ID: ${userId}:`, err);
        throw new Error(`Failed to resolve business document reference for owner ID: ${userId}. ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    try {
      await setDoc(userRef, { trustScore: overallScore }, { merge: true });
      console.log(`[Trust Engine] Logged ${impactScore} points for ${userId}. New Score: ${overallScore} (${rank})`);
    } catch (e) {
      console.error(`[Trust Engine] Error updating trustScore for ${role} ${userId}:`, e);
      throw new Error(`Failed to update trustScore for ${role} ${userId}. ${e instanceof Error ? e.message : String(e)}`);
    }
  }
};
