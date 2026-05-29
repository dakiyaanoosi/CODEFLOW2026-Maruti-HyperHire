"use client";

import { motion } from "framer-motion";

export function Stats() {
  const partners = [
    "IIT Kharagpur",
    "Jadavpur University",
    "St. Xavier's College",
    "Calcutta University",
    "Kolkata Tech Hub",
    "Bengal Enterprise",
  ];

  const stats = [
    { value: "15,000+", label: "Verified Students" },
    { value: "12 mins", label: "Average Match Time" },
    { value: "INR 45L+", label: "Student Earnings" },
    { value: "98.4%", label: "Job Completion Rate" },
  ];

  return (
    <section className="border-b border-brand-hairline bg-white px-4 py-12 md:py-16 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-6 text-center">
          <p className="text-sm font-medium leading-[1.35] tracking-[0.16px] text-brand-muted">
            Connecting talent from top regional institutions
          </p>
          <div className="grid grid-cols-2 gap-4 text-brand-muted md:grid-cols-3 lg:grid-cols-6">
            {partners.map((partner, index) => (
              <motion.span
                key={partner}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
                className="text-sm font-normal leading-[1.25]"
              >
                {partner}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-brand-hairline pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
              className="rounded-[10px] bg-brand-surface-soft p-6"
            >
              <h3 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
                {stat.value}
              </h3>
              <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
