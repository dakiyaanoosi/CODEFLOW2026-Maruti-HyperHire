import type { EscrowTransaction, EscrowSummary } from "@/types/escrow";
// ─── In-memory store (resets on page refresh — demo only) ────────────────────
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
// Clone so mutations don't affect the original seed
let _store: EscrowTransaction[] = SEED_TRANSACTIONS.map((t) => ({ ...t, timeline: [...t.timeline] }));
// ─── Read helpers ─────────────────────────────────────────────────────────────
export async function getEscrowSummary(_uid: string, role: "student" | "business"): Promise<EscrowSummary> {
  const txns = role === "business"
    ? _store.filter((t) => t.businessId === _uid || true)  
    : _store.filter((t) => t.studentId === _uid || true);  
  return {
    totalFunded:     txns.reduce((s, t) => s + t.amount, 0),
    totalReleased:   txns.filter((t) => t.status === "released").reduce((s, t) => s + t.netPayout, 0),
    pendingApproval: txns.filter((t) => t.status === "in_review").length,
    inReview:        txns.filter((t) => t.status === "in_review").length,
    transactions:    txns,
  };
}
export async function getEscrowById(escrowId: string): Promise<EscrowTransaction | null> {
  return _store.find((t) => t.escrowId === escrowId) ?? null;
}
// ─── Mutations ────────────────────────────────────────────────────────────────
export async function approveEscrow(escrowId: string, note: string): Promise<EscrowTransaction> {
  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx === -1) throw new Error("Escrow not found");
  const ts = now();
  _store[idx] = {
    ..._store[idx],
    status: "approved",
    approvalNote: note,
    updatedAt: ts,
    timeline: [..._store[idx].timeline, { type: "approved", timestamp: ts, note }],
  };
  return { ..._store[idx] };
}
export async function releaseEscrow(escrowId: string): Promise<EscrowTransaction> {
  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx === -1) throw new Error("Escrow not found");
  if (_store[idx].status !== "approved") throw new Error("Escrow must be approved before release");
  const ts = now();
  _store[idx] = {
    ..._store[idx],
    status: "released",
    updatedAt: ts,
    timeline: [
      ..._store[idx].timeline,
      { type: "released", timestamp: ts, note: "Funds transferred to student wallet." },
    ],
  };
  return { ..._store[idx] };
}
export async function submitWork(escrowId: string, note: string): Promise<EscrowTransaction> {
  const idx = _store.findIndex((t) => t.escrowId === escrowId);
  if (idx === -1) throw new Error("Escrow not found");
  const ts = now();
  _store[idx] = {
    ..._store[idx],
    status: "in_review",
    submissionNote: note,
    updatedAt: ts,
    timeline: [
      ..._store[idx].timeline,
      { type: "submitted", timestamp: ts, note },
    ],
  };
  return { ..._store[idx] };
}
