"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

export function Testimonials() {
  const list = [
    {
      name: "Srinjoy Chatterjee",
      role: "Business Owner, Kolkata Roast Cafe",
      text: "We needed a branding face-lift and menu design for our new outlet in Salt Lake. Through HyperHire, we matched with Rohan from St. Xavier's in 12 minutes. He delivered pristine files in 3 days. The milestone escrow took all the payment friction away.",
      rating: 5,
    },
    {
      name: "Debayan Sen",
      role: "Student, IIEST Shibpur • Web Developer",
      text: "HyperHire has completely changed how I earn during college. Instead of chasing clients for invoice clearances on social media, I log into the operating system, accept hyperlocal web dev tasks, lock mileston escrows, and get paid instantly upon approval.",
      rating: 5,
    },
    {
      name: "Megha Banerjee",
      role: "Founder, Bengal Tech Solutions",
      text: "Scaling our local marketing assets was a bottleneck until we connected with HyperHire's student pool. The trust scores and verified project portfolios made it extremely easy to filter competent candidates without tedious interviewing cycles.",
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="testimonials" className="py-24 border-b px-4 md:px-8 bg-card/5 relative overflow-hidden">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Testimonials</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Loved by students and local merchants alike.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Hear from regional business founders and university students coordinate operations
            on HyperHire.
          </p>
        </div>

        {/* Grid layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {list.map((item) => (
            <motion.div key={item.name} variants={cardVariants}>
              <Card className="bg-card/45 border backdrop-blur-md hover:border-primary/20 transition-all duration-300 relative select-none h-full flex flex-col justify-between">
                <CardHeader className="pb-3 text-left">
                  {/* Rating stars */}
                  <div className="flex gap-0.5 text-amber-500 mb-3">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <CardTitle className="text-sm font-bold">{item.name}</CardTitle>
                  <CardDescription className="text-[10px]">{item.role}</CardDescription>
                </CardHeader>
                <CardContent className="text-left flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground italic flex-1 mb-4">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <Quote className="h-6 w-6 text-primary/10 ml-auto rotate-180 shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
