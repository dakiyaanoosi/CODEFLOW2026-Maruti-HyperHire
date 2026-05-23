"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export function Testimonials() {
  const list = [
    {
      name: "Srinjoy Chatterjee",
      role: "Business Owner, Kolkata Roast Cafe",
      text: "We matched with a designer from St. Xavier's in 12 minutes. The milestone escrow removed the payment friction from the project.",
    },
    {
      name: "Debayan Sen",
      role: "Student, IIEST Shibpur - Web Developer",
      text: "Instead of chasing clients for invoice clearances, I accept hyperlocal web tasks, track milestones, and get paid when work is approved.",
    },
    {
      name: "Megha Banerjee",
      role: "Founder, Bengal Tech Solutions",
      text: "Trust scores and verified portfolios made it easy to filter competent candidates without a long interview cycle.",
    },
  ];

  return (
    <section id="testimonials" className="border-b border-brand-hairline bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink md:text-[40px]">
            Loved by students and local merchants alike.
          </h2>
          <p className="text-sm font-normal leading-[1.25] text-brand-body">
            Regional businesses and university students coordinate operations on HyperHire.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {list.map((item) => (
            <motion.div
              key={item.name}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
              }}
            >
              <Card className="h-full rounded-[10px] bg-white p-0">
                <CardContent className="flex h-full flex-col gap-6 p-6">
                  <div className="flex gap-1 text-brand-mustard">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm font-normal leading-[1.25] text-brand-body">&ldquo;{item.text}&rdquo;</p>
                  <div className="mt-auto border-t border-brand-hairline pt-4">
                    <h3 className="text-lg font-medium leading-[1.4] text-brand-ink">{item.name}</h3>
                    <p className="mt-1 text-xs text-brand-muted">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
