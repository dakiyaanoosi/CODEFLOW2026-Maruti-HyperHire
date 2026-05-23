"use client";

import * as React from "react";
import { X, Sparkles, Brain, Plus, AlertCircle, CheckCircle2, Loader2, CheckSquare } from "lucide-react";
import { ALL_CATEGORIES, WorkCategory } from "@/types/profile";
import { Job, JobStatus, JobDifficulty, WorkMode } from "@/types/job";
import { analyzeJobDescription } from "@/lib/ai-job-service";
import { jobService } from "@/lib/job-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: Job) => void;
  editJob?: Job | null;
  businessId: string;
  companyName: string;
}

export function JobFormModal({
  isOpen,
  onClose,
  onSuccess,
  editJob = null,
  businessId,
  companyName,
}: JobFormModalProps) {
  const isEditMode = !!editJob;

  // Basic Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [workMode, setWorkMode] = React.useState<WorkMode>("Remote");
  const [budget, setBudget] = React.useState<number>(0);
  const [deadline, setDeadline] = React.useState("");
  
  // Tag / List states
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState("");
  
  const [deliverables, setDeliverables] = React.useState<string[]>([]);
  const [deliverableInput, setDeliverableInput] = React.useState("");

  // AI fields (stored in Firestore)
  const [aiGeneratedSummary, setAiGeneratedSummary] = React.useState("");
  const [aiExtractedSkills, setAiExtractedSkills] = React.useState<string[]>([]);
  const [aiDifficultyScore, setAiDifficultyScore] = React.useState<number>(0);
  const [difficultyLevel, setDifficultyLevel] = React.useState<JobDifficulty>("Intermediate");

  // Status States
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiSuccess, setAiSuccess] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize fields on open
  React.useEffect(() => {
    if (isOpen) {
      if (editJob) {
        setTitle(editJob.title);
        setDescription(editJob.description);
        setCategory(editJob.category);
        setWorkMode(editJob.workMode);
        setBudget(editJob.budget);
        
        // Format ISO date to yyyy-MM-dd
        if (editJob.deadline) {
          setDeadline(editJob.deadline.substring(0, 10));
        } else {
          setDeadline("");
        }
        
        setRequiredSkills(editJob.requiredSkills || []);
        setDeliverables(editJob.deliverables || []);
        setAiGeneratedSummary(editJob.aiGeneratedSummary || "");
        setAiExtractedSkills(editJob.aiExtractedSkills || []);
        setAiDifficultyScore(editJob.aiDifficultyScore || 0);
        setDifficultyLevel(editJob.difficultyLevel || "Intermediate");
        setAiSuccess(!!editJob.aiGeneratedSummary);
      } else {
        // Reset state for new post
        setTitle("");
        setDescription("");
        setCategory(ALL_CATEGORIES[0] || "");
        setWorkMode("Remote");
        setBudget(100);
        
        // Default deadline: 1 week from now
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDeadline(nextWeek.toISOString().substring(0, 10));
        
        setRequiredSkills([]);
        setDeliverables([]);
        setAiGeneratedSummary("");
        setAiExtractedSkills([]);
        setAiDifficultyScore(0);
        setDifficultyLevel("Intermediate");
        setSkillInput("");
        setDeliverableInput("");
        setAiSuccess(false);
      }
      setError(null);
      setIsAnalyzing(false);
    }
  }, [isOpen, editJob]);

  // Adjust default category
  React.useEffect(() => {
    if (!category && ALL_CATEGORIES.length > 0) {
      setCategory(ALL_CATEGORIES[0]);
    }
  }, [category]);

  // Trigger Heuristic AI Description Analysis
  const handleAIAnalysis = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill out the Title and Description first, so that the AI can analyze them.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiSuccess(false);

    try {
      const result = await analyzeJobDescription(title.trim(), description.trim());
      
      // Auto-fill form fields with AI suggestions
      setAiGeneratedSummary(result.aiGeneratedSummary);
      setAiExtractedSkills(result.aiExtractedSkills);
      setAiDifficultyScore(result.aiDifficultyScore);
      setDifficultyLevel(result.difficultyLevel);
      setCategory(result.suggestedCategory);
      
      // Merge extracted skills with user's skills
      const mergedSkills = Array.from(new Set([...requiredSkills, ...result.aiExtractedSkills]));
      setRequiredSkills(mergedSkills);

      setAiSuccess(true);
      showSuccessFeedback();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "AI Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showSuccessFeedback = () => {
    // Scroll modal or focus tags
  };

  // Required Skills tagger
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const formatted = skillInput.trim().replace(/,/g, "");
    if (formatted && !requiredSkills.includes(formatted)) {
      setRequiredSkills([...requiredSkills, formatted]);
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, idx) => idx !== index));
  };

  // Deliverables tagger
  const handleDeliverableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDeliverable();
    }
  };

  const addDeliverable = () => {
    const formatted = deliverableInput.trim();
    if (formatted && !deliverables.includes(formatted)) {
      setDeliverables([...deliverables, formatted]);
      setDeliverableInput("");
    }
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, idx) => idx !== index));
  };

  // Save / Publish
  const handleSave = async (status: JobStatus) => {
    if (!title.trim() || !description.trim() || !category || !deadline) {
      setError("Please fill out all required fields.");
      return;
    }

    if (budget <= 0) {
      setError("Please provide a valid budget greater than zero.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const jobData = {
        businessId,
        companyName,
        title: title.trim(),
        description: description.trim(),
        category,
        requiredSkills,
        budget,
        deadline: new Date(deadline).toISOString(),
        difficultyLevel,
        workMode,
        deliverables,
        status,
        // AI fields
        aiGeneratedSummary: aiGeneratedSummary.trim() || undefined,
        aiExtractedSkills: aiExtractedSkills.length > 0 ? aiExtractedSkills : undefined,
        aiDifficultyScore: aiDifficultyScore > 0 ? aiDifficultyScore : undefined,
      };

      let savedJob: Job;
      
      if (isEditMode && editJob) {
        savedJob = await jobService.updateJob(editJob.jobId, jobData);
      } else {
        savedJob = await jobService.createJob(jobData);
      }

      onSuccess(savedJob);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save job posting. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative z-10 flex h-full max-h-[88vh] w-full max-w-2xl flex-col rounded-[12px] border border-brand-hairline bg-white shadow-2xl overflow-hidden text-brand-ink"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-brand-hairline px-6 bg-brand-surface-soft shrink-0">
            <h2 className="text-base font-semibold leading-none text-brand-ink">
              {isEditMode ? "Edit Gig Listing" : "Create New Gig Post"}
            </h2>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink transition-colors p-1"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-[6px] bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* AI Assistant Banner */}
            <div className="rounded-[10px] border border-brand-info-border bg-brand-surface-soft p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Brain className="h-6 w-6 text-brand-info shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-info flex items-center gap-1.5">
                    AI co-pilot assistant
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-coral" />
                  </p>
                  <p className="text-[11px] text-brand-muted leading-relaxed mt-1">
                    Fill title and description, then run AI Assist. We'll automatically suggest categories, extract relevant skills, write summary insights, and score difficulty.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || isSaving}
                className="flex items-center gap-1.5 rounded-[8px] bg-brand-info text-white px-4 py-2 text-xs font-semibold hover:bg-[#254fad] transition-colors shrink-0 disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-3.5 w-3.5" />
                    AI Assist
                  </>
                )}
              </button>
            </div>

            {/* AI Feedback Banner */}
            {aiSuccess && (
              <div className="flex items-center gap-2 rounded-[6px] bg-brand-success/10 border border-brand-success/20 p-2.5 text-xs text-brand-success font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>AI Insights updated: Auto-assigned category, difficulty, and skill tags!</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Gig Title <span className="text-brand-coral">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="E.g., Figma UI Redesign for Local Delivery Platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Description & Scope <span className="text-brand-coral">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Explain the background, deliverables, timelines, and required credentials..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border resize-none leading-relaxed"
                required
              />
            </div>

            {/* Category / Workmode Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Category <span className="text-brand-coral">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  required
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Mode */}
              <div className="space-y-2">
                <label htmlFor="workMode" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Work Mode <span className="text-brand-coral">*</span>
                </label>
                <select
                  id="workMode"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full h-11 px-3 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  required
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Budget / Deadline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <div className="space-y-2">
                <label htmlFor="budget" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Budget (USD) <span className="text-brand-coral">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-semibold">$</span>
                  <input
                    id="budget"
                    type="number"
                    min="1"
                    placeholder="250"
                    value={budget || ""}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-11 pl-8 pr-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                    required
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Application Deadline <span className="text-brand-coral">*</span>
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  required
                />
              </div>
            </div>

            {/* Required Skills tagger */}
            <div className="space-y-2">
              <label htmlFor="skills" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Required Skills
              </label>
              <div className="flex gap-2">
                <input
                  id="skills"
                  type="text"
                  placeholder="E.g., Next.js, UI/UX (Press Enter/comma to add)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="flex-1 h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="h-11 px-4 rounded-[6px] bg-brand-surface-soft border border-brand-hairline text-brand-ink text-sm font-semibold hover:bg-brand-surface-strong transition-colors"
                >
                  Add
                </button>
              </div>

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      onClick={() => removeSkill(idx)}
                      className="group rounded-[8px] bg-brand-surface-soft px-2.5 py-1 text-xs font-medium text-brand-muted border border-brand-hairline flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                      title="Click to remove"
                    >
                      {skill}
                      <X className="h-3 w-3 text-brand-muted group-hover:text-red-500" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expected Deliverables */}
            <div className="space-y-2">
              <label htmlFor="deliverables" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Expected Deliverables
              </label>
              <div className="flex gap-2">
                <input
                  id="deliverables"
                  type="text"
                  placeholder="E.g., Figma prototype link, 3 pages react component code"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  onKeyDown={handleDeliverableKeyDown}
                  className="flex-1 h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                />
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="h-11 px-4 rounded-[6px] bg-brand-surface-soft border border-brand-hairline text-brand-ink text-sm font-semibold hover:bg-brand-surface-strong transition-colors"
                >
                  Add
                </button>
              </div>

              {deliverables.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {deliverables.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => removeDeliverable(idx)}
                      className="flex items-center justify-between rounded-[8px] bg-brand-surface-soft/60 px-3 py-2 text-xs font-medium text-brand-body border border-brand-hairline cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      title="Click to remove"
                    >
                      <span className="flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5 text-brand-muted" />
                        {item}
                      </span>
                      <X className="h-3.5 w-3.5 text-brand-muted group-hover:text-red-500" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Custom AI Fields Display (for feedback) */}
            {aiSuccess && (
              <div className="rounded-[8px] border border-brand-hairline p-3 bg-brand-surface-soft/50 space-y-2 text-xs">
                <span className="font-semibold text-brand-muted">AI Configured Settings:</span>
                <div className="grid grid-cols-2 gap-2 text-brand-body">
                  <div>
                    <span className="text-brand-muted">Est. Difficulty:</span> {aiDifficultyScore}/10 ({difficultyLevel})
                  </div>
                  <div>
                    <span className="text-brand-muted">Category Match:</span> {category}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="flex h-16 items-center justify-between border-t border-brand-hairline px-6 bg-brand-surface-soft/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave("Draft")}
                disabled={isSaving || isAnalyzing}
                className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave("Published")}
                disabled={isSaving || isAnalyzing}
                className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-colors disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Publish Gig"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
