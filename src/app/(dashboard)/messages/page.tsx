import { MessagingPanel } from "@/components/messages";

export default function MessagesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
          Messages
        </h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">
          Real-time chat between students and businesses.
        </p>
      </div>

      <MessagingPanel />
    </div>
  );
}
