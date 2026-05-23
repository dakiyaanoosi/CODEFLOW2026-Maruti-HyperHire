const recommendations = [
  "Prioritize 3 urgent job matches before noon.",
  "Ask for portfolio links on 2 shortlisted candidates.",
  "Review analytics: video editing demand is rising locally.",
];

export default function AICopilotPanel() {
  return (
    <aside className="border-t border-[#dddddd] bg-white px-4 py-5 xl:sticky xl:top-0 xl:h-screen xl:w-80 xl:shrink-0 xl:border-l xl:border-t-0 xl:px-5 xl:py-6">
      <div className="rounded-xl bg-[#181d26] p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-white text-sm font-medium text-[#181d26]">
            AI
          </span>
          <div>
            <p className="text-sm font-medium leading-[1.35]">AI Copilot</p>
            <p className="text-xs leading-5 text-white/70">Workspace intelligence</p>
          </div>
        </div>

        <p className="mt-5 text-sm font-normal leading-6 text-white/82">
          I can summarize job flow, highlight stalled tasks, and suggest the next best action for
          your local workforce pipeline.
        </p>
      </div>

      <section className="mt-5 rounded-xl border border-[#dddddd] bg-[#f8fafc] p-4">
        <p className="text-sm font-medium leading-[1.35] text-[#181d26]">Suggested actions</p>
        <div className="mt-4 space-y-3">
          {recommendations.map((item, index) => (
            <div key={item} className="flex gap-3 rounded-lg bg-white p-3 ring-1 ring-[#dddddd]">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f5e9d4] text-xs font-medium text-[#181d26]">
                {index + 1}
              </span>
              <p className="text-sm font-normal leading-5 text-[#333840]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-[#dddddd] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium leading-[1.35] text-[#181d26]">AI brief</p>
          <span className="rounded-md bg-[#a8d8c4] px-2 py-1 text-xs font-medium text-[#181d26]">
            Live
          </span>
        </div>
        <p className="mt-3 text-sm font-normal leading-6 text-[#333840]">
          Demand is strongest for short-form video, landing page copy, and event design tasks this
          week.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#181d26] px-4 text-sm font-medium leading-[1.4] text-white active:bg-[#0d1218]"
        >
          Generate plan
        </button>
      </section>
    </aside>
  );
}