import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, orderBy, limit, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SystemNotification } from "@/types/notification";

// Simple in-memory deduplication cache for the current session to prevent firing duplicate notifications rapidly
// Format: `${userId}_${type}_${relatedEntityId}`
const recentNotificationsCache = new Set<string>();

export const notificationService = {
  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: SystemNotification[]) => void,
    maxLimit: number = 50
  ) {
    if (!db) return () => {};

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxLimit)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => doc.data() as SystemNotification);
      onUpdate(notifications);
    });
  },

  async markAsRead(notificationId: string) {
    if (!db) return;
    const ref = doc(db, "notifications", notificationId);
    await updateDoc(ref, { isRead: true });
  },

  async markAllAsRead(userId: string) {
    if (!db) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  },

  /**
   * Internal Event Bus: Creates a notification securely.
   * Includes lightweight deduplication to prevent rapid-fire spam.
   */
  async createNotification(data: Omit<SystemNotification, "notificationId" | "isRead" | "createdAt">) {
    if (!db) return;

    // Deduplication check
    const dedupKey = `${data.userId}_${data.type}_${data.relatedEntityId || "no-entity"}`;
    if (recentNotificationsCache.has(dedupKey)) {
      console.log(`[Notification Service] Deduplicated event: ${dedupKey}`);
      return;
    }

    const ref = doc(collection(db, "notifications"));
    const notification: SystemNotification = {
      ...data,
      notificationId: ref.id,
      isRead: false,
      createdAt: Date.now()
    };

    await setDoc(ref, notification);

    // Cache to prevent duplicate spam within a 2-minute window
    recentNotificationsCache.add(dedupKey);
    setTimeout(() => {
      recentNotificationsCache.delete(dedupKey);
    }, 2 * 60 * 1000);
  }
};
