import { db } from "./firebase";
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
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { Conversation, Message, AttachmentType } from "@/types/message";
import { Application } from "@/types/application";
import { getInitials } from "./message-utils";
import { notificationService } from "./notification-service";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const messageService = {
  subscribeToConversations(
    userId: string, 
    callback: (conversations: Conversation[]) => void
  ) {
    if (!db) return () => {};
    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => doc.data() as Conversation);
      callback(convos);
    }, (error) => {
      console.error("Error subscribing to conversations:", error);
    });
  },

  subscribeToMessages(
    conversationId: string, 
    callback: (messages: Message[]) => void
  ) {
    if (!db) return () => {};
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as Message);
      callback(msgs);
    }, (error) => {
      console.error("Error subscribing to messages:", error);
    });
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: "student" | "business",
    content: string,
    attachmentUrl?: string,
    attachmentType?: AttachmentType
  ): Promise<Message> {
    if (!db) throw new Error("Firestore not initialized");

    const messageId = generateId("msg");
    const now = new Date().toISOString();
    
    const message: Message = {
      messageId,
      conversationId,
      senderId,
      senderRole,
      content,
      messageType: attachmentUrl ? "attachment" : "text",
      attachmentUrl,
      attachmentType,
      readBy: [senderId],
      createdAt: now
    };

    const cleanMessage = Object.fromEntries(
      Object.entries(message).filter(([_, v]) => v !== undefined)
    ) as Message;

    const batch = writeBatch(db);
    
    // 1. Create message
    const msgRef = doc(db, "conversations", conversationId, "messages", messageId);
    batch.set(msgRef, cleanMessage);

    // 2. Update conversation last message and unread counts
    const convRef = doc(db, "conversations", conversationId);
    const convSnapshot = await getDoc(convRef);
    if (convSnapshot.exists()) {
      const convData = convSnapshot.data() as Conversation;
      const newUnreadCounts = { ...convData.unreadCounts };
      
      // Increment unread count for everyone except sender
      convData.participantIds.forEach(id => {
        if (id !== senderId) {
          newUnreadCounts[id] = (newUnreadCounts[id] || 0) + 1;
        }
      });

      batch.update(convRef, {
        lastMessage: attachmentUrl ? "Sent an attachment" : content,
        lastMessageAt: now,
        unreadCounts: newUnreadCounts,
        updatedAt: now
      });
    }

    await batch.commit();

    // Trigger notification to the other participant(s)
    if (convSnapshot.exists()) {
      const convData = convSnapshot.data() as Conversation;
      const recipientIds = convData.participantIds.filter(id => id !== senderId);
      
      for (const recipientId of recipientIds) {
        const senderName = convData.participantNames[senderId] || "Someone";
        await notificationService.createNotification({
          userId: recipientId,
          type: "message",
          title: attachmentUrl ? "New Attachment" : "New Message",
          description: attachmentUrl ? `${senderName} sent an attachment.` : `${senderName} sent you a message.`,
          relatedEntityId: conversationId,
          relatedEntityType: "message",
          actionUrl: "/messages"
        });
      }
    }

    return message;
  },

  async markAsRead(conversationId: string, userId: string) {
    if (!db) return;
    const convRef = doc(db, "conversations", conversationId);
    const snapshot = await getDoc(convRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Conversation;
      if (data.unreadCounts[userId] > 0) {
        await updateDoc(convRef, {
          [`unreadCounts.${userId}`]: 0
        });
      }
    }
  },

  async createConversationFromApplication(
    application: Application,
  ): Promise<Conversation> {
    if (!db) throw new Error("Firestore not initialized");

    // Check if conversation already exists for this app
    const q = query(
      collection(db, "conversations"),
      where("relatedApplicationId", "==", application.applicationId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Conversation;
    }

    const conversationId = generateId("conv");
    const now = new Date().toISOString();

    const conversation: Conversation = {
      conversationId,
      participantIds: [application.studentId, application.businessId],
      participantRoles: {
        [application.studentId]: "student",
        [application.businessId]: "business"
      },
      participantNames: {
        [application.studentId]: application.studentName,
        [application.businessId]: application.companyName
      },
      participantInitials: {
        [application.studentId]: getInitials(application.studentName),
        [application.businessId]: getInitials(application.companyName)
      },
      relatedJobId: application.jobId,
      relatedApplicationId: application.applicationId,
      lastMessage: "Application accepted! You can now start communicating.",
      lastMessageAt: now,
      unreadCounts: {
        [application.studentId]: 1, // Let student know business accepted/opened channel
        [application.businessId]: 0
      },
      createdAt: now,
      updatedAt: now
    };

    const batch = writeBatch(db);
    batch.set(doc(db, "conversations", conversationId), conversation);

    // Initial system message
    const msgId = generateId("msg");
    const sysMessage: Message = {
      messageId: msgId,
      conversationId,
      senderId: "system",
      senderRole: "business",
      content: "Application accepted! You can now start communicating.",
      messageType: "system",
      readBy: [],
      createdAt: now
    };
    
    batch.set(doc(db, "conversations", conversationId, "messages", msgId), sysMessage);

    await batch.commit();
    return conversation;
  }
};
