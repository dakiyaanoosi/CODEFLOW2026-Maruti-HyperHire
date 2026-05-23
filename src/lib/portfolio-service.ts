import { collection, doc, getDoc, setDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { PortfolioItem } from "@/types/portfolio";

const SIMULATED_PORTFOLIOS_KEY = "hyperhire_simulated_portfolios";

// Helper to get simulated portfolios from localStorage
function getSimulatedPortfolios(): Record<string, PortfolioItem> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_PORTFOLIOS_KEY);
  return data ? JSON.parse(data) : {};
}

// Helper to save simulated portfolios to localStorage
function saveSimulatedPortfolios(portfolios: Record<string, PortfolioItem>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_PORTFOLIOS_KEY, JSON.stringify(portfolios));
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

export const portfolioService = {
  /**
   * Fetch all portfolio items, optionally filtered by userId
   */
  async getPortfolios(userId?: string): Promise<PortfolioItem[]> {
    if (isFirebaseConfigured && db) {
      try {
        const portfoliosRef = collection(db, "portfolios");
        let q;
        
        if (userId) {
          q = query(portfoliosRef, where("userId", "==", userId));
        } else {
          q = query(portfoliosRef);
        }
        
        const querySnapshot = await getDocs(q);
        const items: PortfolioItem[] = [];
        
        querySnapshot.forEach((doc) => {
          items.push({
            ...doc.data(),
            portfolioId: doc.id,
          } as PortfolioItem);
        });

        // Sort in memory to avoid needing a Firestore composite index for ordering
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (error) {
        console.error("Firestore getPortfolios error, falling back to simulated:", error);
        // Fall back to simulated database on firestore error (e.g. permission denied)
        return this.getSimulatedPortfoliosList(userId);
      }
    } else {
      return this.getSimulatedPortfoliosList(userId);
    }
  },

  /**
   * Helper to fetch portfolios list from simulated database
   */
  getSimulatedPortfoliosList(userId?: string): PortfolioItem[] {
    const portfolios = getSimulatedPortfolios();
    let list = Object.values(portfolios);
    if (userId) {
      list = list.filter((p) => p.userId === userId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Fetch a single portfolio item by portfolioId
   */
  async getPortfolioItem(portfolioId: string): Promise<PortfolioItem | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "portfolios", portfolioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return {
            ...docSnap.data(),
            portfolioId: docSnap.id,
          } as PortfolioItem;
        }
        return null;
      } catch (error) {
        console.error("Firestore getPortfolioItem error:", error);
        const portfolios = getSimulatedPortfolios();
        return portfolios[portfolioId] || null;
      }
    } else {
      const portfolios = getSimulatedPortfolios();
      return portfolios[portfolioId] || null;
    }
  },

  /**
   * Create a new portfolio item
   */
  async createPortfolioItem(
    item: Omit<PortfolioItem, "portfolioId" | "createdAt" | "updatedAt">
  ): Promise<PortfolioItem> {
    const portfolioId = isFirebaseConfigured && db 
      ? doc(collection(db, "portfolios")).id 
      : "port_" + Math.random().toString(36).substring(2, 9);

    const now = new Date().toISOString();
    
    // Resolve object urls to persistent urls for mock storage if they are custom simulation fields
    let mediaUrl = item.mediaUrl;
    let thumbnailUrl = item.thumbnailUrl;
    
    const rawItem = item as any;
    if (rawItem._persistentUrl) {
      mediaUrl = rawItem._persistentUrl;
      delete rawItem._persistentUrl;
    }
    if (rawItem._persistentThumbnailUrl) {
      thumbnailUrl = rawItem._persistentThumbnailUrl;
      delete rawItem._persistentThumbnailUrl;
    }

    const newItem: PortfolioItem = {
      ...item,
      portfolioId,
      mediaUrl,
      thumbnailUrl,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "portfolios", portfolioId);
        await setDoc(docRef, cleanFirestoreData(newItem));
      } catch (error) {
        console.error("Firestore createPortfolioItem error, saving to simulated db:", error);
        this.saveSimulatedPortfolioItem(newItem);
      }
    } else {
      this.saveSimulatedPortfolioItem(newItem);
    }

    return newItem;
  },

  /**
   * Helper to save a single portfolio item in simulated database
   */
  saveSimulatedPortfolioItem(item: PortfolioItem) {
    const portfolios = getSimulatedPortfolios();
    portfolios[item.portfolioId] = item;
    saveSimulatedPortfolios(portfolios);
  },

  /**
   * Update an existing portfolio item
   */
  async updatePortfolioItem(
    portfolioId: string,
    data: Partial<Omit<PortfolioItem, "portfolioId" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<PortfolioItem> {
    const currentItem = await this.getPortfolioItem(portfolioId);
    if (!currentItem) {
      throw new Error(`Portfolio item not found: ${portfolioId}`);
    }

    // Resolve persistent fields if updating in simulated mode
    let mediaUrl = data.mediaUrl ?? currentItem.mediaUrl;
    let thumbnailUrl = data.thumbnailUrl ?? currentItem.thumbnailUrl;
    
    const rawData = data as any;
    if (rawData._persistentUrl) {
      mediaUrl = rawData._persistentUrl;
      delete rawData._persistentUrl;
    }
    if (rawData._persistentThumbnailUrl) {
      thumbnailUrl = rawData._persistentThumbnailUrl;
      delete rawData._persistentThumbnailUrl;
    }

    const updatedItem: PortfolioItem = {
      ...currentItem,
      ...data,
      mediaUrl,
      thumbnailUrl,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "portfolios", portfolioId);
        await setDoc(docRef, cleanFirestoreData(updatedItem));
      } catch (error) {
        console.error("Firestore updatePortfolioItem error, updating in simulated db:", error);
        this.saveSimulatedPortfolioItem(updatedItem);
      }
    } else {
      this.saveSimulatedPortfolioItem(updatedItem);
    }

    return updatedItem;
  },

  /**
   * Delete a portfolio item
   */
  async deletePortfolioItem(portfolioId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "portfolios", portfolioId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Firestore deletePortfolioItem error, deleting from simulated db:", error);
        this.deleteSimulatedPortfolioItem(portfolioId);
      }
    } else {
      this.deleteSimulatedPortfolioItem(portfolioId);
    }
  },

  /**
   * Helper to delete from simulated database
   */
  deleteSimulatedPortfolioItem(portfolioId: string) {
    const portfolios = getSimulatedPortfolios();
    if (portfolios[portfolioId]) {
      delete portfolios[portfolioId];
      saveSimulatedPortfolios(portfolios);
    }
  }
};
