"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { BrainCircuit, User, Cpu } from "lucide-react";
import { SemanticBadge } from "./SemanticBadge";

// ─── Markdown Renderer ──────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  // Bold + inline code
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-brand-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-[4px] bg-brand-surface-strong px-1 py-0.5 font-mono text-[10px] text-brand-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  let inCode = false;
  let codeLines: string[] = [];
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCode) {
        inCode = false;
        nodes.push(
          <pre
            key={`code-${i}`}
          className="my-2 overflow-x-auto rounded-[6px] bg-brand-ink px-3 py-2.5 font-mono text-[10px] leading-relaxed text-white"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }

    // Table rows  |col|col|
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (!line.includes("---")) {
        const cells = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        nodes.push(
          <div key={i} className="flex gap-2 py-0.5 border-b border-brand-hairline/60 last:border-0">
            {cells.map((cell, ci) => (
              <span key={ci} className={`flex-1 text-[10px] ${ci === 0 ? "text-brand-muted font-semibold" : "font-medium text-brand-ink"}`}>
                {renderInline(cell)}
              </span>
            ))}
          </div>
        );
      }
      return;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={i} className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink">
          {renderInline(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h3 key={i} className="mt-3.5 mb-1.5 text-xs font-semibold text-brand-ink">
          {renderInline(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <li key={i} className="ml-4 list-disc text-xs text-brand-body leading-relaxed my-0.5">
          {renderInline(line.slice(2))}
        </li>
      );
      return;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <li key={i} className="ml-4 list-decimal text-xs text-brand-body leading-relaxed my-0.5">
          {renderInline(numMatch[2])}
        </li>
      );
      return;
    }
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1" />);
      return;
    }
    nodes.push(
      <p key={i} className="text-xs leading-[1.65] text-brand-body">
        {renderInline(line)}
      </p>
    );
  });

  return <div className="space-y-0.5">{nodes}</div>;
}

// ─── Character-streaming component ──────────────────────────────────────────

function StreamingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    // Stream by words at ~35ms per word for a natural feel
    const words = text.split(" ");
    const timer = setInterval(() => {
      if (i < words.length) {
        setDisplayed((prev) => (prev ? prev + " " + words[i] : words[i]));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <>
      {parseMarkdown(displayed)}
      {!done && (
        <span className="inline-block ml-0.5 h-3 w-0.5 animate-pulse bg-brand-muted/50 align-middle" />
      )}
    </>
  );
}

// ─── Reasoning Highlights Card ───────────────────────────────────────────────

function ReasoningCard({ highlights }: { highlights: Record<string, any> }) {
  const entries = Object.entries(highlights);

  const parsePct = (val: any): number => {
    if (typeof val === "number") return Math.round(val * 100);
    const s = String(val).replace("%", "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  };

  return (
    <div className="space-y-2.5 rounded-[10px] border border-brand-hairline bg-white p-3">
      <div className="flex items-center gap-1.5">
        <Cpu className="h-3.5 w-3.5 text-brand-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
          AI Reasoning
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, val]) => {
          const numVal = parsePct(val);
          return (
            <SemanticBadge
              key={key}
              score={numVal}
              label={key.replace(/([A-Z])/g, " $1").trim()}
              size="sm"
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ChatArea ────────────────────────────────────────────────────────────

export function ChatArea() {
  const { history, isLoading, reasoningHighlights } = useHyperAIStore();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-white px-4 py-4">
      {history.map((msg, idx) => {
        const isUser = msg.role === "user";
        const isLastAI = !isUser && idx === history.length - 1;

        return (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {!isUser && (
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-ink bg-brand-ink">
                <BrainCircuit className="h-3.5 w-3.5 text-white" />
                {isLastAI && isLoading === false && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-brand-mint" />
                )}
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`max-w-[84%] rounded-[10px] border px-3.5 py-2.5 text-xs ${
                isUser
                  ? "rounded-tr-[4px] border-brand-ink bg-brand-ink text-white"
                  : "rounded-tl-[4px] border-brand-hairline bg-brand-surface-soft text-brand-ink"
              }`}
            >
              {isUser ? (
                <p className="leading-relaxed font-medium">{msg.content}</p>
              ) : isLastAI ? (
                <StreamingText text={msg.content} />
              ) : (
                parseMarkdown(msg.content)
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-hairline bg-white">
                <User className="h-3.5 w-3.5 text-brand-muted" />
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-ink bg-brand-ink">
            <BrainCircuit className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="rounded-[10px] rounded-tl-[4px] border border-brand-hairline bg-brand-surface-soft px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        </div>
      )}

      {/* Reasoning highlights */}
      {!isLoading && reasoningHighlights && Object.keys(reasoningHighlights).length > 0 && (
        <ReasoningCard highlights={reasoningHighlights} />
      )}

      <div ref={endRef} />
    </div>
  );
}
