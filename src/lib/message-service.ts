import { db } from "./firebase";
import { generateId } from "@/lib/id-utils";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  writeBatch
} from "firebase/firestore";
import { Conversation, Message, AttachmentType } from "@/types/message";
import { Application } from "@/types/application";
import { getInitials } from "./message-utils";
import { notificationService } from "./notification-service";


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
    attachmentType?: AttachmentType,
    contextType?: "general" | "task" | "milestone" | "deliverable" | "review" | "escrow",
    contextId?: string,
    attachments?: string[],
    systemGenerated?: boolean,
    collaborationId?: string
  ): Promise<Message> {
    if (!db) throw new Error("Firestore not initialized");

    const messageId = generateId("msg");
    const now = new Date().toISOString();
    
    let resolvedCollabId = collaborationId;
    const convRef = doc(db, "conversations", conversationId);
    const convSnapshot = await getDoc(convRef);
    if (convSnapshot.exists() && !resolvedCollabId) {
      const convData = convSnapshot.data() as Conversation;
      resolvedCollabId = convData.collaborationId;
    }

    const message: Message = {
      messageId,
      conversationId,
      collaborationId: resolvedCollabId || "",
      senderId,
      senderRole,
      content,
      messageType: systemGenerated ? "system" : (attachmentUrl || (attachments && attachments.length > 0) ? "attachment" : "text"),
      attachmentUrl,
      attachmentType,
      readBy: [senderId],
      createdAt: now,
      contextType: contextType || "general",
      contextId: contextId || undefined,
      attachments: attachments || undefined,
      systemGenerated: systemGenerated || false
    };

    const cleanMessage = Object.fromEntries(
      Object.entries(message).filter((entry) => entry[1] !== undefined)
    ) as Message;

    const batch = writeBatch(db);
    
    // 1. Create message
    const msgRef = doc(db, "conversations", conversationId, "messages", messageId);
    batch.set(msgRef, cleanMessage);

    // 2. Update conversation last message and unread counts
    if (convSnapshot.exists()) {
      const convData = convSnapshot.data() as Conversation;
      const newUnreadCounts = { ...convData.unreadCounts };
      
      // Increment unread count for everyone except sender
      convData.participantIds.forEach(id => {
        if (id !== senderId) {
          newUnreadCounts[id] = (newUnreadCounts[id] || 0) + 1;
        }
      });

      let preview = content;
      if (attachmentUrl || (attachments && attachments.length > 0)) {
        preview = "Sent an attachment";
      } else if (systemGenerated) {
        preview = `[Activity] ${content}`;
      } else if (contextType && contextType !== "general") {
        preview = `[${contextType}] ${content}`;
      }

      batch.update(convRef, {
        lastMessage: preview,
        lastMessageAt: now,
        unreadCounts: newUnreadCounts,
        updatedAt: now
      });
    }

    await batch.commit();

    // Trigger notification to the other participant(s)
    if (convSnapshot.exists() && senderId !== "system") {
      const convData = convSnapshot.data() as Conversation;
      const recipientIds = convData.participantIds.filter(id => id !== senderId);
      
      for (const recipientId of recipientIds) {
        const senderName = convData.participantNames[senderId] || "Someone";
        let title = attachmentUrl || (attachments && attachments.length > 0) ? "New Attachment" : "New Message";
        let desc = attachmentUrl || (attachments && attachments.length > 0) ? `${senderName} sent an attachment.` : `${senderName} sent you a message.`;

        if (contextType && contextType !== "general") {
          title = `New ${contextType} feedback`;
          desc = `${senderName} commented in ${contextType} thread: "${content.substring(0, 30)}..."`;
        }

        await notificationService.createNotification({
          userId: recipientId,
          type: "message",
          title,
          description: desc,
          relatedEntityId: conversationId,
          relatedEntityType: "message",
          actionUrl: `/workflows/${convData.collaborationId || conversationId}`
        });
      }
    }

    return message;
  },

  async sendSystemMessage(
    conversationId: string,
    collaborationId: string,
    content: string,
    contextType?: "general" | "task" | "milestone" | "deliverable" | "review" | "escrow",
    contextId?: string
  ): Promise<Message> {
    return this.sendMessage(
      conversationId,
      "system",
      "business",
      content,
      undefined,
      undefined,
      contextType || "general",
      contextId,
      undefined,
      true,
      collaborationId
    );
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
    collaborationId?: string,
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
      collaborationId,
      lastMessage: "Collaboration started! You can now start communicating.",
      lastMessageAt: now,
      unreadCounts: {
        [application.studentId]: 1,
        [application.businessId]: 0
      },
      createdAt: now,
      updatedAt: now
    };

    // Clean undefined fields
    const cleanedConversation = Object.fromEntries(
      Object.entries(conversation).filter(([, v]) => v !== undefined)
    ) as Conversation;

    const batch = writeBatch(db);
    batch.set(doc(db, "conversations", conversationId), cleanedConversation);

    // Initial system message
    const msgId = generateId("msg");
    const sysMessage: Message = {
      messageId: msgId,
      conversationId,
      collaborationId: collaborationId || "",
      senderId: "system",
      senderRole: "business",
      content: "Collaboration started! You can now start communicating.",
      messageType: "system",
      readBy: [],
      createdAt: now
    };
    
    batch.set(doc(db, "conversations", conversationId, "messages", msgId), sysMessage);

    await batch.commit();
    return conversation;
  }
};
