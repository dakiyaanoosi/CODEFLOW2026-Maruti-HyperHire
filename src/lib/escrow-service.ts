import type { EscrowTransaction, EscrowSummary, EscrowStatus } from "@/types/escrow";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from "firebase/firestore";

const now = () => new Date().toISOString();

const SEED_TRANSACTIONS: EscrowTransaction[] = [
  {
    escrowId: "esc_001",
    jobId: "job_001",
    jobTitle: "Landing Page Redesign",
    businessId: "biz_001",
    businessName: "Verve Studio",
    studentId: "stu_001",
    studentName: "Ananya Sharma",
    amount: 18_000,
    platformFee: 1_800,
    netPayout: 16_200,
    currency: "INR",
    status: "in_review",
    createdAt: "2026-05-01T09:00:00Z",
    updatedAt: "2026-05-20T14:30:00Z",
    submissionNote: "All deliverables uploaded to the shared drive. Figma file & exported assets included.",
    timeline: [
      { type: "funded",    timestamp: "2026-05-01T09:00:00Z", note: "Escrow funded by Verve Studio" },
      { type: "submitted", timestamp: "2026-05-20T14:30:00Z", note: "Student submitted final deliverables" },
    ],
  },
  {
    escrowId: "esc_002",
    jobId: "job_002",
    jobTitle: "API Integration",
    businessId: "biz_001",
    businessName: "Verve Studio",
    studentId: "stu_002",
    studentName: "Rohan Mehta",
    amount: 13_000,
    platformFee: 1_300,
    netPayout: 11_700,
    currency: "INR",
    status: "approved",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-05-18T11:00:00Z",
    approvalNote: "Excellent work — all endpoints tested and passing.",
    timeline: [
      { type: "funded",    timestamp: "2026-04-15T10:00:00Z" },
      { type: "submitted", timestamp: "2026-05-10T16:45:00Z" },
      { type: "approved",  timestamp: "2026-05-18T11:00:00Z", note: "Excellent work — all endpoints tested and passing." },
    ],
  },
  {
    escrowId: "esc_003",
    jobId: "job_003",
    jobTitle: "ML Model Integration",
    businessId: "biz_002",
    businessName: "NovaTech",
    studentId: "stu_003",
    studentName: "Dev Kapoor",
    amount: 92_000,
    platformFee: 9_200,
    netPayout: 82_800,
    currency: "INR",
    status: "released",
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
    approvalNote: "Model accuracy exceeded targets. Released immediately.",
    timeline: [
      { type: "funded",    timestamp: "2026-03-01T08:00:00Z" },
      { type: "submitted", timestamp: "2026-05-05T12:00:00Z" },
      { type: "approved",  timestamp: "2026-05-08T15:00:00Z" },
      { type: "released",  timestamp: "2026-05-10T09:00:00Z", note: "Funds transferred to student wallet." },
    ],
  },
  {
    escrowId: "esc_004",
    jobId: "job_004",
    jobTitle: "Mobile App UI",
    businessId: "biz_002",
    businessName: "NovaTech",
    studentId: "stu_004",
    studentName: "Fatima Noor",
    amount: 48_000,
    platformFee: 4_800,
    netPayout: 43_200,
    currency: "INR",
    status: "funded",
    createdAt: "2026-05-15T07:00:00Z",
    updatedAt: "2026-05-15T07:00:00Z",
    timeline: [
      { type: "funded", timestamp: "2026-05-15T07:00:00Z", note: "Escrow funded. Awaiting student delivery." },
    ],
  },
  {
    escrowId: "esc_005",
    jobId: "job_005",
    jobTitle: "Brand Identity Kit",
    businessId: "biz_003",
    businessName: "Pixel Labs",
    studentId: "stu_005",
    studentName: "Priya Singh",
    amount: 52_000,
    platformFee: 5_200,
    netPayout: 46_800,
    currency: "INR",
    status: "in_review",
    createdAt: "2026-05-02T11:00:00Z",
    updatedAt: "2026-05-22T10:00:00Z",
    submissionNote: "Brand guidelines PDF, logo files (SVG/PNG), and color palette sheet delivered.",
    timeline: [
      { type: "funded",    timestamp: "2026-05-02T11:00:00Z" },
      { type: "submitted", timestamp: "2026-05-22T10:00:00Z" },
    ],
  },
];

// Local memory fallback store
let _store: EscrowTransaction[] = SEED_TRANSACTIONS.map((t) => ({ ...t, timeline: [...t.timeline] }));

// Clean object helper
function cleanData(data: any) {
  const clean: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
}

// Seed function
async function seedEscrowsIfEmpty() {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snap = await getDocs(collection(db, "escrows"));
    if (snap.empty) {
      const batch = writeBatch(db);
      SEED_TRANSACTIONS.forEach((t) => {
        const ref = doc(db!, "escrows", t.escrowId);
        batch.set(ref, cleanData(t));
      });
      await batch.commit();
      console.log("[Escrow Service] Seeded default transactions to Firestore.");
    }
  } catch (e) {
    console.error("Failed to seed escrows to Firestore:", e);
  }
}

// Helper to compile summary from a list of transactions
function compileSummary(txns: EscrowTransaction[]): EscrowSummary {
  return {
    totalFunded:     txns.reduce((s, t) => s + t.amount, 0),
    totalReleased:   txns.filter((t) => t.status === "released").reduce((s, t) => s + t.netPayout, 0),
    pendingApproval: txns.filter((t) => t.status === "in_review").length,
    inReview:        txns.filter((t) => t.status === "in_review").length,
    transactions:    txns,
  };
}

// ─── Read helpers ─────────────────────────────────────────────────────────────
export async function getEscrowSummary(_uid: string, role: "student" | "business"): Promise<EscrowSummary> {
  if (isFirebaseConfigured && db) {
    try {
      await seedEscrowsIfEmpty();
      const colRef = collection(db, "escrows");
      const q = query(
        colRef,
        where(role === "business" ? "businessId" : "studentId", "==", _uid)
      );
      const snap = await getDocs(q);
      const txns: EscrowTransaction[] = [];
      snap.forEach((d) => {
        txns.push(d.data() as EscrowTransaction);
      });
      // Sort in memory by updatedAt descending
      txns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return compileSummary(txns);
    } catch (error) {
      console.error("Firestore getEscrowSummary error, falling back to memory:", error);
    }
  }
  
  // Memory/Local storage fallback
  const txns = role === "business"
    ? _store.filter((t) => t.businessId === _uid)  
    : _store.filter((t) => t.studentId === _uid);  
  return compileSummary(txns);
}

export async function getEscrowById(escrowId: string): Promise<EscrowTransaction | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "escrows", escrowId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as EscrowTransaction;
      }
      return null;
    } catch (error) {
      console.error("Firestore getEscrowById error:", error);
    }
  }
  return _store.find((t) => t.escrowId === escrowId) ?? null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export async function approveEscrow(escrowId: string, note: string): Promise<EscrowTransaction> {
  const ts = now();
  const current = await getEscrowById(escrowId);
  if (!current) throw new Error("Escrow not found");

  const updated: EscrowTransaction = {
    ...current,
    status: "approved" as EscrowStatus,
    approvalNote: note,
    updatedAt: ts,
    timeline: [...current.timeline, { type: "approved", timestamp: ts, note }],
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "escrows", escrowId);
      await setDoc(docRef, cleanData(updated), { merge: true });
      return updated;
    } catch (error) {
      console.error("Firestore approveEscrow error, saving to memory:", error);
    }
  }

  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx !== -1) {
    _store[idx] = updated;
  }
  return updated;
}

export async function releaseEscrow(escrowId: string): Promise<EscrowTransaction> {
  const ts = now();
  const current = await getEscrowById(escrowId);
  if (!current) throw new Error("Escrow not found");
  if (current.status !== "approved") throw new Error("Escrow must be approved before release");

  const updated: EscrowTransaction = {
    ...current,
    status: "released" as EscrowStatus,
    updatedAt: ts,
    timeline: [
      ...current.timeline,
      { type: "released", timestamp: ts, note: "Funds transferred to student wallet." },
    ],
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "escrows", escrowId);
      await setDoc(docRef, cleanData(updated), { merge: true });
      return updated;
    } catch (error) {
      console.error("Firestore releaseEscrow error, saving to memory:", error);
    }
  }

  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx !== -1) {
    _store[idx] = updated;
  }
  return updated;
}

export async function submitWork(escrowId: string, note: string): Promise<EscrowTransaction> {
  const ts = now();
  const current = await getEscrowById(escrowId);
  if (!current) throw new Error("Escrow not found");

  const updated: EscrowTransaction = {
    ...current,
    status: "in_review" as EscrowStatus,
    submissionNote: note,
    updatedAt: ts,
    timeline: [
      ...current.timeline,
      { type: "submitted", timestamp: ts, note },
    ],
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "escrows", escrowId);
      await setDoc(docRef, cleanData(updated), { merge: true });
      return updated;
    } catch (error) {
      console.error("Firestore submitWork error, saving to memory:", error);
    }
  }

  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx !== -1) {
    _store[idx] = updated;
  }
  return updated;
}

