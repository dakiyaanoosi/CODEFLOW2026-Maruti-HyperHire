import { collection, query, where, getDocs, DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { BusinessProfile } from "@/types/business";
import { businessService } from "../business-service";

/**
 * Resolves the Firestore DocumentReference of the business profile owned by the specified ownerId.
 * Returns null if not found.
 */
export async function getBusinessDocRefByOwnerId(ownerId: string): Promise<DocumentReference | null> {
  if (isFirebaseConfigured && db) {
    try {
      const businessesRef = collection(db, "businesses");
      const q = query(businessesRef, where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].ref;
      }
      return null;
    } catch (error) {
      console.error("Firestore getBusinessDocRefByOwnerId error:", error);
      throw error;
    }
  }
  return null;
}

/**
 * Resolves the Firestore DocumentSnapshot of the business profile owned by the specified ownerId.
 * Returns null if not found.
 */
export async function getBusinessDocByOwnerId(ownerId: string): Promise<DocumentSnapshot | null> {
  if (isFirebaseConfigured && db) {
    try {
      const businessesRef = collection(db, "businesses");
      const q = query(businessesRef, where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      }
      return null;
    } catch (error) {
      console.error("Firestore getBusinessDocByOwnerId error:", error);
      throw error;
    }
  }
  return null;
}

/**
 * Resolves the BusinessProfile details of the business profile owned by the specified ownerId.
 * Returns null if not found.
 */
export async function getBusinessProfileByOwnerId(ownerId: string): Promise<BusinessProfile | null> {
  return businessService.getBusinessProfileByOwner(ownerId);
}
